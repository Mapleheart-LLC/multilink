document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('webhookForm');
    const tagSearch = document.getElementById('tagSearch');
    const tagDropdown = document.getElementById('tagDropdown');
    const selectedTagsContainer = document.getElementById('selectedTags');
    const statusDiv = document.getElementById('status');

    // Maintain selected tags
    const selectedTags = new Set();

    // Add showStatus function
    function showStatus(message, type = 'info') {
        if (!statusDiv) return;
        
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // Update fetchAllTags to use local showStatus
    async function fetchAllTags() {
        try {
            const response = await fetch('http://15.204.232.236:5000/tags');
            const data = await response.json();
            return data.tags.sort();
        } catch (error) {
            console.error('Error fetching tags:', error);
            showStatus('Error fetching tags', 'error');
            return [];
        }
    }

    // Update addTagToAPI to use local showStatus
    async function addTagToAPI(tagName) {
        try {
            const response = await fetch('http://15.204.232.236:5000/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: tagName })
            });
            const data = await response.json();
            if (!response.ok || !data.message) {
                throw new Error('Failed to add tag');
            }
            showStatus(`Tag "${tagName}" added successfully`, 'info');
            return true;
        } catch (error) {
            console.error('Error adding tag:', error);
            showStatus('Error adding tag', 'error');
            return false;
        }
    }

    // Populate dropdown initially
    async function populateTagDropdown(filter = '') {
        tagDropdown.innerHTML = '';
        const allTags = await fetchAllTags();
        const filteredTags = allTags.filter(tag => 
            tag.toLowerCase().includes(filter.toLowerCase()) && 
            !selectedTags.has(tag)
        );

        if (filteredTags.length === 0) {
            const noResultsItem = document.createElement('div');
            noResultsItem.textContent = 'No tags found';
            noResultsItem.classList.add('tag-dropdown-item');
            tagDropdown.appendChild(noResultsItem);
        } else {
            filteredTags.forEach(tag => {
                const tagItem = document.createElement('div');
                tagItem.textContent = tag;
                tagItem.classList.add('tag-dropdown-item');
                tagItem.addEventListener('click', () => addTag(tag));
                tagDropdown.appendChild(tagItem);
            });
        }
    }

    // Add a tag
    async function addTag(tag) {
        if (!selectedTags.has(tag)) {
            const allTags = await fetchAllTags();
            if (!allTags.includes(tag)) {
                const success = await addTagToAPI(tag);
                if (!success) return;
            }

            selectedTags.add(tag);
            updateSelectedTagsDisplay();
            tagSearch.value = '';
            populateTagDropdown();
            tagDropdown.classList.remove('active');
            tagSearch.focus();
        }
    }

    // Remove a tag
    function removeTag(tag) {
        selectedTags.delete(tag);
        updateSelectedTagsDisplay();
        populateTagDropdown();
    }

    // Update selected tags display
    function updateSelectedTagsDisplay() {
        selectedTagsContainer.innerHTML = '';
        selectedTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('selected-tag');
            
            const tagText = document.createElement('span');
            tagText.textContent = tag;
            
            const removeButton = document.createElement('span');
            removeButton.textContent = '×';
            removeButton.classList.add('selected-tag-remove');
            removeButton.addEventListener('click', () => removeTag(tag));
            
            tagElement.appendChild(tagText);
            tagElement.appendChild(removeButton);
            selectedTagsContainer.appendChild(tagElement);
        });
    }

    async function populateTagDropdown(filter = '') {
        tagDropdown.innerHTML = '';
        const allTags = await fetchAllTags();
        const filteredTags = allTags.filter(tag =>
            tag.toLowerCase().includes(filter.toLowerCase()) &&
            !selectedTags.has(tag)
        );
    
        if (filteredTags.length === 0 && filter.trim()) {
            const noResultsItem = document.createElement('div');
            noResultsItem.textContent = `Add "${filter}"`;
            noResultsItem.classList.add('tag-dropdown-item', 'add-tag-option');
            noResultsItem.addEventListener('click', () => {
                addTag(filter.trim());
                tagDropdown.classList.remove('active'); // Close dropdown after adding
                tagSearch.value = ''; // Clear input field
            });
    
            tagDropdown.appendChild(noResultsItem);
        } else {
            filteredTags.forEach(tag => {
                const tagItem = document.createElement('div');
                tagItem.textContent = tag;
                tagItem.classList.add('tag-dropdown-item');
                tagItem.addEventListener('click', () => addTag(tag));
                tagDropdown.appendChild(tagItem);
            });
        }
    }
    
    

    // Tag search input event listeners
    tagSearch.addEventListener('input', function () {
        populateTagDropdown(this.value);
        tagDropdown.classList.add('active');
    });

    tagSearch.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            if (tagSearch.value.trim()) {
                addTag(tagSearch.value.trim());
            }
        } else if (e.key === 'Tab' || e.key === ',') {
            e.preventDefault(); // Prevent default behavior
            if (tagSearch.value.trim()) {
                addTag(tagSearch.value.trim());
            }
        }
    });

    tagSearch.addEventListener('blur', function () {
        if (tagSearch.value.trim()) {
            addTag(tagSearch.value.trim());
        }
        tagDropdown.classList.remove('active');
    });


    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!tagSearch.contains(event.target) && !tagDropdown.contains(event.target)) {
            tagDropdown.classList.remove('active');
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const webhookUrl = document.getElementById('webhookUrl').value.trim();

        // Validate webhook URL
        if (!webhookUrl) {
            showStatus('Please enter a webhook URL', 'error');
            return;
        }

        try {
            const response = await fetch('http://15.204.232.236:5000/webhooks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    webhook_url: webhookUrl, 
                    tags: Array.from(selectedTags)
                })
            });

            if (response.ok) {
                showStatus('✓ Webhook registered successfully!', 'success');
                form.reset();
                selectedTags.clear();
                updateSelectedTagsDisplay();
            } else {
                const errorData = await response.json();
                showStatus(errorData.message || 'Failed to register webhook', 'error');
            }
        } catch (error) {
            showStatus('❌ Failed to register webhook. Please try again.', 'error');
            console.error('Webhook registration error:', error);
        }
    });

    // Initial population of dropdown
    populateTagDropdown();
});


