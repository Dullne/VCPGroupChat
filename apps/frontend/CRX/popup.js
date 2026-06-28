document.addEventListener('DOMContentLoaded', () => {
    const statusMessage = document.getElementById('status-message');
    const sessionListContainer = document.getElementById('session-list-container');
    const sessionSelect = document.getElementById('session-select');
    const sessionContent = document.getElementById('session-content');
    const refreshButton = document.getElementById('refresh-button');
    const deleteButton = document.getElementById('delete-session-button');
    const exportCurrentButton = document.getElementById('export-current-button'); // Get the new button
    const exportAllButton = document.getElementById('export-all-button');
    const importReplaceButton = document.getElementById('import-replace-button'); // Renamed
    const importMergeButton = document.getElementById('import-merge-button');   // Added
    const importFileInput = document.getElementById('import-file-input');

    let targetTabId = null;
    let currentChatData = null; // Store the fetched chat data
    let currentImportMode = 'replace'; // Track which import button was clicked ('replace' or 'merge')

    // --- Initialization ---
    findAndLoadChatData();

    // --- Event Listeners ---
    refreshButton.addEventListener('click', findAndLoadChatData);
    sessionSelect.addEventListener('change', displaySelectedSessionContent);
    deleteButton.addEventListener('click', handleDeleteSession);
    exportCurrentButton.addEventListener('click', handleExportCurrent);
    exportAllButton.addEventListener('click', handleExportAll);
    // Both import buttons trigger the same file input, but we'll track the mode
    importReplaceButton.addEventListener('click', () => triggerImport('replace'));
    importMergeButton.addEventListener('click', () => triggerImport('merge'));
    importFileInput.addEventListener('change', (event) => handleImportFile(event, currentImportMode)); // Pass mode to handler

    // --- Functions ---

    /** Finds the target chat tab and loads data */
    async function findAndLoadChatData() {
        setStatus("正在查找聊天页面...", false);
        sessionListContainer.style.display = 'none';
        targetTabId = null; // Reset tab ID
        currentChatData = null; // Reset data

        try {
            // Ask background script to find the tab
            const response = await chrome.runtime.sendMessage({ action: 'find_chat_tab_id' });
            if (response && response.tabId) {
                targetTabId = response.tabId;
                console.log("Popup: Found target tab ID:", targetTabId);
                loadChatDataFromTab();
            } else {
                setStatus("未找到活动的 AI 群聊页面。", true);
                console.log("Popup: Target tab not found.");
            }
        } catch (error) {
            console.error("Popup: Error finding chat tab:", error);
            setStatus(`查找页面时出错: ${error.message}`, true);
        }
    }

    /** Loads chat data from the identified target tab */
    async function loadChatDataFromTab() {
        if (!targetTabId) {
            setStatus("错误：无法加载数据，未找到目标页面。", true);
            return;
        }
        setStatus("正在从页面加载聊天记录...", false);
        try {
            // Send message via background script to content script
            const response = await chrome.runtime.sendMessage({
                targetTabId: targetTabId,
                action: 'get_chat_data'
            });

            console.log("Popup: Received response for get_chat_data:", response);

            if (response && response.success && response.data) {
                currentChatData = response.data; // Store the data
                populateSessionSelect(currentChatData);
                displaySelectedSessionContent(); // Display content for the initially selected session
                setStatus("", false); // Clear status message
                sessionListContainer.style.display = 'block'; // Show the main container
                deleteButton.disabled = !currentChatData.activeSessionId; // Disable delete if no active session
            } else {
                const errorMsg = response?.error || "无法解析响应";
                setStatus(`加载数据失败: ${errorMsg}`, true);
                console.error("Popup: Failed to get chat data:", errorMsg);
                sessionListContainer.style.display = 'none';
            }
        } catch (error) {
            console.error("Popup: Error loading chat data:", error);
            setStatus(`加载数据时出错: ${error.message}`, true);
            sessionListContainer.style.display = 'none';
        }
    }

    /** Populates the session select dropdown */
    function populateSessionSelect(chatData) {
        sessionSelect.innerHTML = ''; // Clear existing options
        const sessionIds = Object.keys(chatData.sessions || {});

        if (sessionIds.length === 0) {
            const option = document.createElement('option');
            option.textContent = "无会话记录";
            option.disabled = true;
            sessionSelect.appendChild(option);
            sessionContent.innerHTML = '没有可显示的会话。'; // Clear content area
            deleteButton.disabled = true; // Disable delete button
            return;
        }

        sessionIds.forEach(sessionId => {
            const session = chatData.sessions[sessionId];
            const option = document.createElement('option');
            option.value = sessionId;
            // Use session name or fallback to a formatted ID/date
            option.textContent = session.name || `会话 ${sessionId.substring(8, 12)}`;
            option.selected = sessionId === chatData.activeSessionId;
            sessionSelect.appendChild(option);
        });

        // Ensure delete button state is correct based on selection
        deleteButton.disabled = !sessionSelect.value;
    }

    /** Displays the content of the currently selected session */
    function displaySelectedSessionContent() {
        sessionContent.innerHTML = ''; // Clear previous content
        const selectedSessionId = sessionSelect.value;

        if (!selectedSessionId || !currentChatData || !currentChatData.sessions[selectedSessionId]) {
            sessionContent.innerHTML = '请选择一个会话以查看内容。';
            deleteButton.disabled = true;
            return;
        }

        deleteButton.disabled = false; // Enable delete button if a session is selected

        const session = currentChatData.sessions[selectedSessionId];
        const history = session.history || [];

        if (history.length === 0) {
            sessionContent.innerHTML = '此会话没有消息。';
            return;
        }

        // Render messages
        history.forEach((msg, index) => { // Add index here
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message-item');
            messageDiv.classList.add(msg.role === 'user' ? 'user-message' : 'ai-message');
            messageDiv.dataset.messageIndex = index; // Store index on the element

            const senderSpan = document.createElement('span');
            senderSpan.classList.add('message-sender');
            senderSpan.textContent = msg.name || (msg.role === 'user' ? 'User' : 'AI');
            messageDiv.appendChild(senderSpan);

            const content = msg.content || {};
            let textDiv = null; // Keep a reference to the text div

            if (content.text) {
                textDiv = document.createElement('div'); // Assign to the reference
                textDiv.classList.add('message-text');
                textDiv.textContent = content.text;
                messageDiv.appendChild(textDiv);
            }

            if (content.image) {
                const imgElement = document.createElement('img');
                imgElement.classList.add('message-image');
                imgElement.src = content.image;
                imgElement.alt = '聊天图片';
                messageDiv.appendChild(imgElement);
                // Optionally disable editing for image messages or allow editing caption?
                // For now, edit button only works if there's text.
            }

            // Add Edit Button (only if there's text content)
            if (textDiv) { // Only add edit button if there is a text div
                const editButton = document.createElement('button');
                editButton.classList.add('edit-message-button');
                editButton.textContent = '✏️'; // Edit icon
                editButton.title = '编辑此消息';
                editButton.addEventListener('click', () => handleEditMessage(messageDiv, index));
                messageDiv.appendChild(editButton);

                // Add Delete Button (always add, maybe disable for certain types later if needed)
                const deleteMessageButton = document.createElement('button');
                deleteMessageButton.classList.add('delete-message-button'); // Add specific class
                deleteMessageButton.textContent = '🗑️'; // Delete icon
                deleteMessageButton.title = '删除此消息';
                deleteMessageButton.addEventListener('click', () => handleDeleteMessage(index)); // Pass index
                messageDiv.appendChild(deleteMessageButton);
            }


            sessionContent.appendChild(messageDiv);
        });
         // Scroll to top of content area after loading
         sessionContent.scrollTop = 0;
    }

    /** Handles deleting the currently selected session */
    async function handleDeleteSession() {
        const sessionIdToDelete = sessionSelect.value;
        if (!sessionIdToDelete || !targetTabId) {
            setStatus("请先选择一个会话。", true);
            return;
        }

        if (!confirm(`确定要删除会话 "${sessionSelect.options[sessionSelect.selectedIndex].text}" 吗？此操作无法撤销。`)) {
            return;
        }

        setStatus("正在删除会话...", false);
        deleteButton.disabled = true; // Disable while processing

        try {
            const response = await chrome.runtime.sendMessage({
                targetTabId: targetTabId,
                action: 'delete_session',
                sessionId: sessionIdToDelete
            });

            if (response && response.success) {
                setStatus("会话已删除。", false);
                // Reload data to reflect the change
                loadChatDataFromTab(); // This will repopulate select and update display
            } else {
                const errorMsg = response?.error || "未知错误";
                setStatus(`删除失败: ${errorMsg}`, true);
                console.error("Popup: Failed to delete session:", errorMsg);
                deleteButton.disabled = false; // Re-enable on failure
            }
        } catch (error) {
            console.error("Popup: Error deleting session:", error);
            setStatus(`删除时出错: ${error.message}`, true);
            deleteButton.disabled = false; // Re-enable on failure
        }
    }

    /** Handles exporting the currently selected chat data */
    function handleExportCurrent() {
        const selectedSessionId = sessionSelect.value;

        if (!selectedSessionId || !currentChatData || !currentChatData.sessions[selectedSessionId]) {
            setStatus("请先选择一个有效的会话以导出。", true);
            return;
        }

        const sessionToExport = currentChatData.sessions[selectedSessionId];
        const sessionName = sessionToExport.name || `session_${selectedSessionId.substring(8, 12)}`;

        // Create an object containing only the selected session, maintaining structure
        const exportData = {
            sessions: {
                [selectedSessionId]: sessionToExport
            },
            activeSessionId: selectedSessionId // Indicate this was the active one in the export
        };

        try {
            const dataStr = JSON.stringify(exportData, null, 2); // Pretty print JSON
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            // Create a filename with session name and date/time
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-');
            // Sanitize session name for filename
            const safeSessionName = sessionName.replace(/[^a-z0-9_\-\s]/gi, '_').replace(/\s+/g, '_');
            a.download = `ai_chat_session_${safeSessionName}_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Clean up

            setStatus(`会话 "${sessionName}" 已导出。`, false);
        } catch (error) {
            console.error("Popup: Error exporting current session:", error); // Corrected log message
            setStatus(`导出当前会话失败: ${error.message}`, true); // Corrected status message
        }
    }

    /** Handles exporting all chat data */ // Added this function header for clarity
    function handleExportAll() { // Added this function which was missing
        if (!currentChatData || Object.keys(currentChatData.sessions || {}).length === 0) {
            setStatus("没有可导出的数据。", true);
            return;
        }

        try {
            const dataStr = JSON.stringify(currentChatData, null, 2); // Pretty print JSON
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            // Create a filename with date/time
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-');
            a.download = `ai_group_chat_history_all_${timestamp}.json`; // Added 'all' to filename
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Clean up

            setStatus("所有会话数据已导出。", false);
        } catch (error) {
            console.error("Popup: Error exporting all data:", error);
            setStatus(`导出全部失败: ${error.message}`, true);
        }
    }

    /** Handles clicking the edit button on a message */
    function handleEditMessage(messageDiv, messageIndex) {
        // Prevent multiple edits on the same message
        if (messageDiv.querySelector('.edit-textarea')) {
            return;
        }

        const textDiv = messageDiv.querySelector('.message-text');
        const currentText = textDiv ? textDiv.textContent : '';
        const editButton = messageDiv.querySelector('.edit-message-button');

        // Hide original text and edit button
        if (textDiv) textDiv.style.display = 'none';
        if (editButton) editButton.style.display = 'none';

        // Create textarea
        const editTextArea = document.createElement('textarea');
        editTextArea.classList.add('edit-textarea');
        editTextArea.value = currentText;

        // Create Save button
        const saveButton = document.createElement('button');
        saveButton.textContent = '保存';
        saveButton.classList.add('save-edit-button');
        saveButton.addEventListener('click', () => saveMessageEdit(messageDiv, messageIndex, editTextArea));

        // Create Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.classList.add('cancel-edit-button');
        cancelButton.addEventListener('click', () => cancelMessageEdit(messageDiv));

        // Add controls container
        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('edit-controls');
        controlsDiv.appendChild(saveButton);
        controlsDiv.appendChild(cancelButton);

        // Insert textarea and controls after the sender span (or at the end if no textDiv initially)
        const senderSpan = messageDiv.querySelector('.message-sender');
        if (senderSpan) {
            senderSpan.insertAdjacentElement('afterend', editTextArea);
            editTextArea.insertAdjacentElement('afterend', controlsDiv);
        } else {
            messageDiv.appendChild(editTextArea);
            messageDiv.appendChild(controlsDiv);
        }

        editTextArea.focus(); // Focus the textarea
    }

    /** Saves the edited message content */
    async function saveMessageEdit(messageDiv, messageIndex, editTextArea) {
        const selectedSessionId = sessionSelect.value;
        const newText = editTextArea.value.trim(); // Trim whitespace

        if (!selectedSessionId || !currentChatData || !currentChatData.sessions[selectedSessionId] || !targetTabId) {
            setStatus("错误：无法保存，会话或目标页面丢失。", true);
            cancelMessageEdit(messageDiv); // Revert UI
            return;
        }

        // Update the local data structure
        const session = currentChatData.sessions[selectedSessionId];
        if (session.history && session.history[messageIndex]) {
             // Ensure the content object exists
             if (!session.history[messageIndex].content) {
                 session.history[messageIndex].content = {};
             }
            session.history[messageIndex].content.text = newText;
        } else {
            setStatus("错误：无法找到要更新的消息。", true);
            cancelMessageEdit(messageDiv); // Revert UI
            return;
        }

        setStatus("正在保存更改...", false);
        // Disable buttons during save
        const saveButton = messageDiv.querySelector('.save-edit-button');
        const cancelButton = messageDiv.querySelector('.cancel-edit-button');
        if(saveButton) saveButton.disabled = true;
        if(cancelButton) cancelButton.disabled = true;


        try {
            // Send the entire updated chatData object to be saved
            const response = await chrome.runtime.sendMessage({
                targetTabId: targetTabId,
                action: 'save_chat_data',
                data: currentChatData // Send the whole modified object
            });

            if (response && response.success) {
                setStatus("更改已保存。", false);
                // Update the UI permanently
                const textDiv = messageDiv.querySelector('.message-text');
                 if (textDiv) {
                    textDiv.textContent = newText;
                 } else {
                     // If textDiv didn't exist initially (e.g., image only message edited)
                     // We might need to create it here, or adjust logic based on desired behavior
                     console.warn("Edited message did not originally have a text element.");
                     // For now, just log. If needed, create textDiv here.
                 }
                cancelMessageEdit(messageDiv); // Clean up edit UI elements
            } else {
                const errorMsg = response?.error || "未知错误";
                setStatus(`保存失败: ${errorMsg}`, true);
                 // Re-enable buttons on failure
                 if(saveButton) saveButton.disabled = false;
                 if(cancelButton) cancelButton.disabled = false;
                // Optionally revert local data changes if save fails?
                // For simplicity, we don't revert local data here, user can retry saving.
            }
        } catch (error) {
            console.error("Popup: Error saving message edit:", error);
            setStatus(`保存时出错: ${error.message}`, true);
             // Re-enable buttons on failure
             if(saveButton) saveButton.disabled = false;
             if(cancelButton) cancelButton.disabled = false;
        }
    }

    /** Cancels the message edit and restores the original view */
    function cancelMessageEdit(messageDiv) {
        const textDiv = messageDiv.querySelector('.message-text');
        const editTextArea = messageDiv.querySelector('.edit-textarea');
        const controlsDiv = messageDiv.querySelector('.edit-controls');
        const editButton = messageDiv.querySelector('.edit-message-button');

        // Remove edit elements
        if (editTextArea) editTextArea.remove();
        if (controlsDiv) controlsDiv.remove();

        // Restore original text view and edit button
        if (textDiv) textDiv.style.display = ''; // Restore display
        // Edit button is hidden/shown on hover via CSS, no need to explicitly show here
        // if (editButton) editButton.style.display = '';
    }

    /** Handles deleting a single message */
    async function handleDeleteMessage(messageIndex) {
        const selectedSessionId = sessionSelect.value;

        if (!selectedSessionId || !currentChatData || !currentChatData.sessions[selectedSessionId] || !targetTabId) {
            setStatus("错误：无法删除，会话或目标页面丢失。", true);
            return;
        }

        const session = currentChatData.sessions[selectedSessionId];
        if (!session.history || !session.history[messageIndex]) {
             setStatus("错误：无法找到要删除的消息。", true);
             return;
        }

        const messageToDelete = session.history[messageIndex];
        const messagePreview = messageToDelete.content?.text?.substring(0, 30) || (messageToDelete.content?.image ? '[图片]' : '[空消息]');

        if (!confirm(`确定要删除消息 "${messagePreview}..." 吗？此操作无法撤销。`)) {
            return;
        }

        setStatus("正在删除消息...", false);

        // Remove the message from the local data structure
        session.history.splice(messageIndex, 1);

        // Save the modified chat data back to the content script
        try {
            const response = await chrome.runtime.sendMessage({
                targetTabId: targetTabId,
                action: 'save_chat_data', // Reuse save action, as it replaces the whole data
                data: currentChatData
            });

            if (response && response.success) {
                setStatus("消息已删除。", false);
                // Re-render the content to reflect the deletion
                displaySelectedSessionContent();
            } else {
                // Attempt to revert local change if save failed
                session.history.splice(messageIndex, 0, messageToDelete); // Put it back
                const errorMsg = response?.error || "未知错误";
                setStatus(`删除失败: ${errorMsg}. 已撤销本地更改。`, true);
                console.error("Popup: Failed to save after deleting message:", errorMsg);
            }
        } catch (error) {
             // Attempt to revert local change if communication failed
             session.history.splice(messageIndex, 0, messageToDelete); // Put it back
             console.error("Popup: Error saving after message delete:", error);
             setStatus(`删除时出错: ${error.message}. 已撤销本地更改。`, true);
        }
    }


    /** Triggers the file input click and sets the import mode */
    function triggerImport(mode) {
        currentImportMode = mode; // Set the mode for the handler
        importFileInput.click();
    }

    /** Handles file selection for import (now supports multiple files and modes) */
     async function handleImportFile(event, importMode) { // Added importMode parameter
        const files = event.target.files; // Get FileList
        if (!files || files.length === 0) {
            return; // No files selected
        }

        // Basic check for JSON type (can be improved)
        for (const file of files) {
            if (file.type !== 'application/json') {
                setStatus(`错误：文件 "${file.name}" 不是有效的 JSON 文件。`, true);
                importFileInput.value = null; // Reset file input
                return;
            }
        }

        // Ask for confirmation before overwriting (only for replace mode)
        if (importMode === 'replace') {
             if (!confirm("导入并替换将覆盖当前页面上的所有聊天记录。确定要继续吗？")) {
                 importFileInput.value = null; // Reset file input
                 return;
             }
        } else {
             // Optional: Confirm merge? Usually merge is less destructive.
             // if (!confirm("将导入文件中的会话合并到现有记录中（相同 ID 会被覆盖）。确定要继续吗？")) {
             //     importFileInput.value = null;
             //     return;
             // }
        }


        setStatus(`正在${importMode === 'replace' ? '替换' : '合并'}导入数据...`, false);
        let combinedSessions = {}; // Object to hold sessions from all files for merge
        let firstFileData = null; // To hold data for replace mode (only uses first file)
        let filesRead = 0;
        const totalFiles = files.length;

        if (importMode === 'replace' && totalFiles > 1) {
             setStatus("警告：替换模式下仅导入第一个选定的文件。", false); // Inform user
        }

        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            // Skip extra files in replace mode
            if (importMode === 'replace' && i > 0) {
                continue;
            }

            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    // Basic validation
                    if (typeof importedData !== 'object' || importedData === null || typeof importedData.sessions !== 'object') {
                        throw new Error(`文件 "${file.name}" 格式无效或缺少 'sessions' 键。`);
                    }

                    if (importMode === 'replace') {
                        firstFileData = importedData; // Store data for replace
                    } else { // Merge mode
                        // Add sessions from this file to the combined object
                        Object.assign(combinedSessions, importedData.sessions);
                    }

                } catch (error) {
                    console.error(`Popup: Error reading or parsing import file "${file.name}":`, error);
                    setStatus(`导入文件 "${file.name}" 处理失败: ${error.message}`, true);
                    // Stop processing further files on error? Or continue? For now, stop.
                    importFileInput.value = null; // Reset file input
                    return; // Exit the onload handler for this file
                } finally {
                    filesRead++;
                    // Check if all files have been processed
                    if (filesRead === (importMode === 'replace' ? 1 : totalFiles)) {
                        await finalizeImport(importMode, importMode === 'replace' ? firstFileData : { sessions: combinedSessions });
                    }
                }
            }; // End reader.onload

            reader.onerror = () => {
                setStatus(`读取文件 "${file.name}" 时出错: ${reader.error}`, true);
                importFileInput.value = null; // Reset file input
                // Stop processing on read error
                return;
            };
            reader.readAsText(file);
        } // End for loop
    }

    /** Finalizes the import process after files are read */
    async function finalizeImport(importMode, dataToImport) {
         if (!targetTabId) {
             setStatus("错误：无法导入，未找到目标页面。", true);
             importFileInput.value = null; // Reset file input
             return;
         }
         if (!dataToImport) {
              setStatus("错误：没有读取到有效的导入数据。", true);
              importFileInput.value = null; // Reset file input
              return;
         }

        const action = importMode === 'replace' ? 'replace_chat_data' : 'merge_chat_data';
        console.log(`Popup: Sending action "${action}" with data:`, dataToImport);

        try {
            // Send data to content script via background script to save/merge
            const response = await chrome.runtime.sendMessage({
                targetTabId: targetTabId,
                action: action, // Use dynamic action
                data: dataToImport // Send either single file data (replace) or combined sessions (merge)
            });

            if (response && response.success) {
                setStatus("数据导入成功！正在刷新列表...", false);
                loadChatDataFromTab(); // Reload data to show changes
            } else {
                const errorMsg = response?.error || "未知错误";
                setStatus(`导入失败: ${errorMsg}`, true);
                console.error("Popup: Failed to import data:", errorMsg);
            }
        } catch (error) {
             console.error("Popup: Error finalizing import:", error);
             setStatus(`导入时发生通信错误: ${error.message}`, true);
        } finally {
            importFileInput.value = null; // Reset file input regardless of outcome
        }
    }


    /** Sets the status message */
    function setStatus(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.style.color = isError ? 'red' : '#666'; // Use red for errors
        statusMessage.style.display = message ? 'block' : 'none'; // Show/hide
    }
});