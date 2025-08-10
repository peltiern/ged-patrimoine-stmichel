// Charger le formulaire dans la page contact
fetch('components/contact-form.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('contact-form-container').innerHTML = html;
    })
    .catch(err => {
        document.getElementById('contact-form-container').innerHTML =
            '<p>Erreur de chargement du formulaire.</p>';
        console.error(err);
    });
