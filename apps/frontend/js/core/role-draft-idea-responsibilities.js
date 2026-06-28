export function deriveResponsibilitiesFromIdea(idea) {
    const responsibilities = [];

    if (/产品|需求|路线图|用户/.test(idea)) {
        responsibilities.push('拆解需求并输出产品判断');
    }
    if (/代码|开发|技术|工程|架构/.test(idea)) {
        responsibilities.push('评估技术实现路径与工程风险');
    }
    if (/研究|调研|分析|信息/.test(idea)) {
        responsibilities.push('补充调研信息并形成结构化结论');
    }
    if (/写作|文案|文章|总结|表达/.test(idea)) {
        responsibilities.push('整理表达并输出清晰成稿');
    }
    if (/推进|协调|管理|交付|统筹/.test(idea)) {
        responsibilities.push('推进任务分工与协作交付');
    }
    if (/教育|课程|老师|教学/.test(idea)) {
        responsibilities.push('按循序渐进方式引导学习与理解');
    }

    responsibilities.push('与其他角色协作，只提供增量价值');
    return [...new Set(responsibilities)];
}
