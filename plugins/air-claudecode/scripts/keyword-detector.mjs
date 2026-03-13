#!/usr/bin/env node

/**
 * UserPromptSubmit hook: detects skill/agent keywords in user prompts
 * and suggests the corresponding skill or agent.
 */

import {readFile} from "node:fs/promises";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || join(__dirname, "..");
const AGENTS_DIR = join(PLUGIN_ROOT, "agents");

async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString();
}

/**
 * Skill keyword mapping.
 * Each key is a skill name, values are trigger keywords.
 * Skills are invoked via /air-claudecode:<skill-name>.
 */
const SKILL_KEYWORDS = {
    "git-commit": ["commit", "커밋", "커밋해", "commit this", "커밋 만들"],
    "git-flow-master": [
        "git flow", "깃플로우", "깃 플로우",
        "feature start", "feature finish", "feature publish",
        "release start", "release finish", "release publish",
        "hotfix start", "hotfix finish", "hotfix publish",
        "flow init", "flow overview",
    ],
    "git-branch": ["create branch", "브랜치 만들", "branch from", "new branch", "브랜치 생성"],
    "git-pr-master": ["pr", "pr 만들", "pr 생성", "create pr", "open pr", "merge pr", "pull request", "풀 리퀘스트"],
    "git-issue-master": ["git issue", "github issue", "깃 이슈", "깃헙 이슈", "이슈 만들", "이슈 생성", "create issue", "file issue", "open issue"],
    "jira-master": ["jira", "지라", "티켓 만들", "티켓 생성", "티켓 조회", "티켓 수정", "jira ticket", "jira issue"],
    "slack-master": ["slack", "슬랙", "슬랙 메시지", "슬랙 채널", "slack message", "slack channel", "send slack", "read slack", "슬랙 보내"],
    "setup-air-cc": ["setup", "설정", "설치 확인", "configure air", "air-claudecode setup"],
    "code-review": ["code review", "코드 리뷰", "리뷰해", "review this", "pr review", "코드리뷰"],
    "software-engineer": ["implement", "구현", "개발", "add feature", "refactor", "코드 작성", "software engineer"],
    "test-engineer": ["test", "테스트", "테스트 작성", "write test", "test code", "테스트 코드", "테스트 만들"],
    "sql-generator": ["sql", "쿼리", "query", "ddl", "dml", "select", "create table", "테이블 생성"],
    "gog-calendar": ["일정", "스케줄", "schedule", "calendar", "캘린더", "오늘 일정", "이번주 일정", "내일 일정", "meeting", "미팅 잡아"],
    "technical-writing": ["기술 문서", "문서 작성", "technical writing", "write document", "write a guide", "가이드 작성", "문서화"],
    "sentence-refiner": ["문장 다듬", "문장 교정", "sentence refine", "refine sentence", "문장 수정", "문체 교정"],
    "deep-dive-plan": ["deep dive plan", "deep plan", "심층 분석", "계획 수립", "deep dive", "implementation plan", "구현 계획"],
    "xsd-to-kotlin": ["xsd", "xsd to kotlin", "xml schema", "xsd 변환", "xsd 코틀린", "스키마 변환", "xml 스키마", "soap model", "data class from xsd", "xsd data class"],
    "git-pr-babysit": ["babysit", "pr babysit", "pr 모니터링", "pr monitoring", "pr 감시", "pr 리뷰 자동"],
};

/**
 * Agent keyword mapping (for agents without a matching skill).
 */
const AGENT_KEYWORDS = {
    // Currently all agents have matching skills, add agent-only entries here if needed
};

function matchesKeyword(text, keyword) {
    const hasAsciiLetter = /[a-zA-Z]/.test(keyword);
    if (hasAsciiLetter) {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${escaped}\\b`, "i").test(text);
    }
    return text.toLowerCase().includes(keyword.toLowerCase());
}

function detectSkill(userPrompt) {
    for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
        for (const keyword of keywords) {
            if (matchesKeyword(userPrompt, keyword)) {
                return {type: "skill", name: skill};
            }
        }
    }
    for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
        for (const keyword of keywords) {
            if (matchesKeyword(userPrompt, keyword)) {
                return {type: "agent", name: agent};
            }
        }
    }
    return null;
}

async function loadAgentPrompt(agentName) {
    try {
        const filePath = join(AGENTS_DIR, `${agentName}.md`);
        return await readFile(filePath, "utf-8");
    } catch {
        return null;
    }
}

async function main() {
    const input = await readStdin();
    let data;
    try {
        data = JSON.parse(input);
    } catch {
        console.log(JSON.stringify({continue: true}));
        return;
    }

    const userPrompt = data.user_prompt || data.userPrompt || data.prompt || "";
    if (!userPrompt) {
        console.log(JSON.stringify({continue: true}));
        return;
    }

    // Don't interfere with explicit skill invocations
    if (userPrompt.startsWith("/air-claudecode:")) {
        console.log(JSON.stringify({continue: true}));
        return;
    }

    const match = detectSkill(userPrompt);
    if (!match) {
        console.log(JSON.stringify({continue: true}));
        return;
    }

    let message;

    if (match.type === "skill") {
        message = `Detected relevant skill: **${match.name}**. Use the \`/air-claudecode:${match.name}\` skill for this task. Invoke: Skill(skill="air-claudecode:${match.name}", args="${userPrompt.replace(/"/g, '\\"').slice(0, 150)}")`;
    } else {
        const agentPrompt = await loadAgentPrompt(match.name);
        if (!agentPrompt) {
            console.log(JSON.stringify({continue: true}));
            return;
        }
        message = `Detected relevant agent: **${match.name}**. Delegate: Task(subagent_type="air-claudecode:${match.name}", prompt="${userPrompt.replace(/"/g, '\\"').slice(0, 200)}")`;
    }

    console.log(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: "UserPromptSubmit",
            additionalContext: message,
        },
    }));
}

main().catch(() => {
    console.log(JSON.stringify({continue: true}));
});
