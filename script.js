// script.js

// Utility function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
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
    // Try using the modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showStatus('✓ Link copied to clipboard!', 'success'))
            .catch(() => fallbackCopyToClipboard(text));
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback clipboard method using textarea
function fallbackCopyToClipboard(text) {
    // Create a temporary textarea
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible but keep it in the viewport
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    
    try {
        // Select and copy the text
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
        // Clean up
        document.body.removeChild(textArea);
    }
}

// Main form submission function
async function submitForm() {
    const form = document.getElementById('messageForm');
    const textarea = form.querySelector('textarea');
    const submitButton = form.querySelector('button');
    const message = textarea.value.trim();
    
    // Basic validation
    if (!message) {
        showStatus('Please enter a link to share', 'error');
        textarea.focus();
        return;
    }
    
    // URL validation (with some common protocols)
    if (!isValidUrl(message) && 
        !message.startsWith('http://') && 
        !message.startsWith('https://') && 
        !message.startsWith('ftp://')) {
        showStatus('Please enter a valid URL starting with http://, https://, or ftp://', 'error');
        textarea.focus();
        return;
    }
    
    // Visual feedback
    submitButton.disabled = true;
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Sharing...';
    
    try {
        const response = await fetch('https://trigger.macrodroid.com/834a628e-a605-4607-8ecf-d36b504db193/multi?multiIn=' + encodeURIComponent(message));
        
        if (response.ok) {
            showStatus('🎉 Link shared successfully!', 'success');
            textarea.value = '';
            textarea.style.height = 'auto'; // Reset height
            copyToClipboard(message); // Copy the shared link to clipboard
            
            // Save to recent shares in localStorage
            saveRecentShare(message);
        } else {
            throw new Error('Network response was not ok');
        }
    } catch (error) {
        showStatus('❌ Failed to share link. Please try again.', 'error');
        console.error('Share error:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
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
        // Keep only last 5 shares
        localStorage.setItem('recentShares', JSON.stringify(recentShares.slice(0, 5)));
    } catch (e) {
        console.error('Failed to save recent share:', e);
    }
}

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('messageForm');
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
});