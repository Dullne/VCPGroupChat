function capitalizeFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildStateAccessorsBySpec(deps) {
    const {
        getStateValue,
        setStateValue,
        specs
    } = deps;

    const accessors = {};
    for (const spec of specs) {
        const suffix = capitalizeFirst(spec.name);
        if (spec.get !== false) {
            accessors[`get${suffix}`] = getStateValue(spec.key);
        }
        if (spec.set) {
            accessors[`set${suffix}`] = setStateValue(spec.key);
        }
    }

    return accessors;
}
