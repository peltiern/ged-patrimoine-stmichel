function initContactForm(options = {}) {
    const explicationsField = document.getElementById('explications');
    const objetField = document.getElementById('objet');
    const numPhotoField = document.getElementById('numero_photo');

    if (options.mode === 'signalement') {
        explicationsField.innerHTML = `Vous souhaitez signaler la photo <b>n°${options.photo}</b>. Merci de préciser ce qui pose problème.`;
        objetField.value = `Signalement photo ${options.photo}`;
        numPhotoField.value = options.photo;
    } else {
        explicationsField.textContent = `Vous avez des suggestions, des remarques, des critiques à faire sur ce site ? Envoyez-nous un message.`;
        objetField.value = 'Contact général';
    }
}
