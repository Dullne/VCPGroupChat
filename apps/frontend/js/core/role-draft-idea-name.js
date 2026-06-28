export function suggestRoleNameFromIdea(idea) {
    const explicitPatterns = [
        /(?:叫|名为|名称是|名字是)[“"「]?([^，。；、“"」]{2,24})/u,
        /[“"「]([^”"」]{2,24})[”"」]/u
    ];

    for (const pattern of explicitPatterns) {
        const match = idea.match(pattern);
        if (match?.[1]) {
            return match[1].trim();
        }
    }

    if (/产品|需求/.test(idea) && /代码|开发|技术|工程/.test(idea)) {
        return '产品技术统筹';
    }
    if (/研究|调研|分析/.test(idea)) {
        return '研究分析师';
    }
    if (/写作|文案|文章|总结|表达/.test(idea)) {
        return '内容写作师';
    }
    if (/运营|增长|营销|转化/.test(idea)) {
        return '增长运营师';
    }
    if (/协调|推进|管理|交付|统筹/.test(idea)) {
        return '协作推进官';
    }
    if (/教育|课程|老师|教学/.test(idea)) {
        return '学习教练';
    }

    return '自定义角色';
}
