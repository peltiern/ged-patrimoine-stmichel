document.addEventListener('submit', async function(e) {
    if (e.target && e.target.id === 'contactForm') {
        e.preventDefault();
        inlineError.textContent = '';

        const form = e.target;
        const submitBtn = document.getElementById('submitBtn');

        // Vérifie honeypot
        if (document.getElementById('_gotcha').value.trim() !== "") return;

        // simple validation côté client
        if (!form.name.value.trim() || !form.email.value.trim() || !form.message.value.trim()) {
            inlineError.textContent = "Veuillez renseigner le nom et l'email.";
            return;
        }

        // Active spinner
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        try {
            const res = await fetch("https://formcarry.com/s/5rrRUap3AC3", {
                method: "POST",
                headers: {"Content-Type": "application/json", "Accept": "application/json"},
                body: JSON.stringify({
                    name: form.name.value,
                    email: form.email.value,
                    message: form.message.value,
                    objet: form.objet.value,
                    numeroPhoto: form.numero_photo.value,
                    _gotcha: form._gotcha.value
                })
            });

            if (res.ok) {
                // animation de sortie du formulaire
                form.style.transition = 'opacity .28s ease, transform .28s ease';
                form.style.opacity = '0';
                form.style.transform = 'translateY(-8px)';
                // après transition, on cache le form et affiche le success
                setTimeout(() => {
                    form.classList.add('hidden');
                    successBox.classList.add('show');
                    successBox.focus();
                }, 320);
                form.reset();
            } else {
                // tente d'extraire un message d'erreur utile
                let errText = `Erreur ${res.status}`;
                try {
                    const json = await res.json();
                    if (json && (json.message || json.error)) errText = json.message || json.error;
                } catch (_) {
                    errText = res.statusText || errText;
                }
                inlineError.textContent = errText;
            }
        } catch (error) {
            inlineError.textContent = error;
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    }
})