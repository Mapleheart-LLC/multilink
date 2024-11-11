document.getElementById('messageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button');
    const buttonContent = submitButton.querySelector('.button-content');
    const statusDiv = document.getElementById('status');
    const message = form.querySelector('textarea').value.trim();
    
    if (!message) {
        statusDiv.textContent = 'Please enter a link';
        statusDiv.className = 'status error';
        return;
    }
    
    // Disable the button and show loading state
    submitButton.disabled = true;
    buttonContent.innerHTML = `
        <svg class="animate-spin" viewBox="0 0 24 24" width="24" height="24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Sharing...</span>
    `;
    statusDiv.className = 'status';
    statusDiv.textContent = '';
    
    try {
        const response = await fetch('https://trigger.macrodroid.com/834a628e-a605-4607-8ecf-d36b504db193/multi?multiIn=' + encodeURIComponent(message));
        
        if (response.ok) {
            statusDiv.textContent = '🎉 Link shared successfully!';
            statusDiv.className = 'status success';
            form.reset();
        } else {
            throw new Error('Failed to share link');
        }
    } catch (error) {
        statusDiv.textContent = '❌ Failed to share link. Please try again.';
        statusDiv.className = 'status error';
    } finally {
        submitButton.disabled = false;
        buttonContent.innerHTML = `
            <svg class="share-icon" viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            </svg>
            <span>Share Link</span>
        `;
    }
});