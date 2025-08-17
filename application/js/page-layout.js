async function includeLayout() {
    const headerContainer = document.getElementById('site-header');
    const footerContainer = document.getElementById('site-footer');

    if (headerContainer) {
        const res = await fetch('components/header.html');
        headerContainer.innerHTML = await res.text();
    }

    if (footerContainer) {
        const res = await fetch('components/footer.html');
        footerContainer.innerHTML = await res.text();
    }
}

document.addEventListener('DOMContentLoaded', includeLayout);
