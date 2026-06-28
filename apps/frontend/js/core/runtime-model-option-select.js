export function populateModelSelectOptions(select, models, autoOptionLabel) {
    select.innerHTML = '';

    const autoOption = document.createElement('option');
    autoOption.value = '';
    autoOption.textContent = autoOptionLabel;
    select.appendChild(autoOption);

    for (const model of models) {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        select.appendChild(option);
    }
}
