// Configuration
const API_BASE_URL = 'https://api.mapleheart.org'; // Replace with your actual API base URL
const selectedTags = new Set();

// Utility function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Fetch network device counts
async function fetchNetworkStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/status`);
        if (!response.ok) {
            throw new Error('Failed to fetch network stats');
        }
        const stats = await response.json();
        
        // Update UI with device counts based on the actual response
        document.getElementById('pc-count').textContent = stats.active_clients || 0;
        document.getElementById('phone-count').textContent = stats.total_webhooks || 0;
    } catch (error) {
        console.error('Error fetching network stats:', error);
        // Fallback to show 0 or '-'
        document.getElementById('pc-count').textContent = 'Server';
        document.getElementById('phone-count').textContent = 'Down';
    }
}

// Handle textarea shortcuts and auto-resize
function initializeTextarea() {
    const textarea = document.getElementById('message');
    
    // Auto-resize textarea as user types
    function autoResize() {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
    
    // Handle enter key and other keyboard shortcuts
    function handleKeydown(e) {
        // Submit on Ctrl/Cmd + Enter
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submitForm();
        }
        // Regular enter key adds newline
        else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitForm();
        }
        // Escape key clears the textarea
        else if (e.key === 'Escape') {
            e.preventDefault();
            textarea.value = '';
            autoResize();
            hideStatus();
        }
    }
    
    textarea.addEventListener('input', autoResize);
    textarea.addEventListener('keydown', handleKeydown);
    
    // Initial resize
    autoResize();
}

// Status message handling
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(hideStatus, 3000);
    }
}

function hideStatus() {
    const statusDiv = document.getElementById('status');
    statusDiv.className = 'status';
    statusDiv.textContent = '';
}

// Clipboard functionality with fallback
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showStatus('✓ Link copied to clipboard!', 'success'))
            .catch(() => fallbackCopyToClipboard(text));
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    
    try {
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        if (successful) {
            showStatus('✓ Link copied to clipboard!', 'success');
        } else {
            showStatus('✓ Link shared! (Copy to clipboard not supported)', 'success');
        }
    } catch (err) {
        showStatus('✓ Link shared! (Copy to clipboard not supported)', 'success');
    } finally {
        document.body.removeChild(textArea);
    }
}

// Recent shares handling with error handling
function saveRecentShare(url) {
    if (!window.localStorage) {
        console.log('LocalStorage not supported');
        return;
    }
    
    try {
        const recentShares = JSON.parse(localStorage.getItem('recentShares') || '[]');
        recentShares.unshift(url);
        localStorage.setItem('recentShares', JSON.stringify(recentShares.slice(0, 5)));
    } catch (e) {
        console.error('Failed to save recent share:', e);
    }
}

// Handle form submission
async function submitForm() {
    const textarea = document.getElementById('message');
    const link = textarea.value.trim();
    
    // Validate input
    if (!link) {
        showStatus('Please enter a link', 'error');
        return;
    }
    
    if (!isValidUrl(link)) {
        showStatus('Please enter a valid URL', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/urls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: link,
                tags: Array.from(selectedTags)
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to share link');
        }
        
        // Clear textarea and show success message
        textarea.value = '';
        textarea.style.height = 'auto';
        selectedTags.clear();
        updateSelectedTagsDisplay();
        showStatus('Link shared successfully!', 'success');
        
        // Refresh network stats
        fetchNetworkStats();
        
    } catch (error) {
        console.error('Error sharing link:', error);
        showStatus('Failed to share link. Please try again.', 'error');
    }
}

// Add this function for fetching tags
async function fetchAllTags() {
    try {
        const response = await fetch(`${API_BASE_URL}/tags`);
        const data = await response.json();
        return data.tags.sort();
    } catch (error) {
        console.error('Error fetching tags:', error);
        showStatus('Error fetching tags', 'error');
        return [];
    }
}

// Add these tag-related functions
async function addTagToAPI(tagName) {
    try {
        const response = await fetch(`${API_BASE_URL}/tags`, {
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

// Add tag UI handling functions
function removeTag(tag) {
    selectedTags.delete(tag);
    updateSelectedTagsDisplay();
    populateTagDropdown();
}

function updateSelectedTagsDisplay() {
    const selectedTagsContainer = document.getElementById('selectedTags');
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
    const tagDropdown = document.getElementById('tagDropdown');
    const tagSearch = document.getElementById('tagSearch');
    tagDropdown.innerHTML = '';
    
    // Don't show dropdown if input is empty and not focused
    if (!filter.trim() && document.activeElement !== tagSearch) {
        tagDropdown.classList.remove('active');
        return;
    }
    
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
            tagDropdown.classList.remove('active');
            tagSearch.value = '';
        });
        tagDropdown.appendChild(noResultsItem);
        tagDropdown.classList.add('active');
    } else if (filteredTags.length > 0) {
        filteredTags.forEach(tag => {
            const tagItem = document.createElement('div');
            tagItem.textContent = tag;
            tagItem.classList.add('tag-dropdown-item');
            tagItem.addEventListener('click', () => {
                addTag(tag);
                tagDropdown.classList.remove('active');
            });
            tagDropdown.appendChild(tagItem);
        });
        tagDropdown.classList.add('active');
    } else {
        tagDropdown.classList.remove('active');
    }
}

// Add this helper function if not already present
async function addTag(tag) {
    if (!selectedTags.has(tag)) {
        const allTags = await fetchAllTags();
        if (!allTags.includes(tag)) {
            const success = await addTagToAPI(tag);
            if (!success) return;
        }
        selectedTags.add(tag);
        updateSelectedTagsDisplay();
        document.getElementById('tagSearch').value = '';
        populateTagDropdown();
    }
}

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('messageForm');
    const tagSearch = document.getElementById('tagSearch');
    const tagDropdown = document.getElementById('tagDropdown');

    if (!form) {
        console.error('Message form not found!');
        return;
    }
    
    // Initialize textarea handlers
    initializeTextarea();
    
    // Form submit handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitForm();
    });
    
    // Clear button handler
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'clear-button';
    clearButton.textContent = 'Clear';
    clearButton.onclick = function() {
        const textarea = document.getElementById('message');
        textarea.value = '';
        textarea.style.height = 'auto';
        hideStatus();
        textarea.focus();
    };
    form.appendChild(clearButton);

    // Fetch network stats on page load
    fetchNetworkStats();

    // Initialize tag search handlers
    tagSearch?.addEventListener('input', function() {
        populateTagDropdown(this.value);
        tagDropdown?.classList.add('active');
    });
    
    tagSearch?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
            e.preventDefault();
            if (tagSearch.value.trim()) {
                addTag(tagSearch.value.trim());
            }
        }
    });
    
    // Initial population of tag dropdown
    populateTagDropdown();
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!tagSearch.contains(event.target) && !tagDropdown.contains(event.target)) {
            tagDropdown.classList.remove('active');
        }
    });

    // Show dropdown on focus
    tagSearch.addEventListener('focus', function() {
        if (this.value.trim() || tagDropdown.children.length > 0) {
            tagDropdown.classList.add('active');
        }
    });
});
