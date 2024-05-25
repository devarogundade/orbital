<template>
    <section>
        <div class="app_width">
            <footer>
                <div class="page">
                    <h3>Products</h3>

                    <RouterLink to="/borrow">Borrow</RouterLink>
                    <RouterLink to="/amplifier">Amplify your LTV</RouterLink>
                    <RouterLink to="/faucet">Faucet</RouterLink>
                </div>

                <div class="page">
                    <h3>Resources</h3>

                    <a target="_blank" href="/">Pitch deck</a>
                    <a target="_blank" href="/">Demo</a>
                </div>

                <div class="page">
                    <h3>About</h3>

                    <a target="_blank" href="https://www.linkedin.com/in/devarogundade/">LinkedIn</a>
                </div>

                <div class="page">
                    <h3>Socials</h3>

                    <a target="_blank" href="https://x.com/myorbital_xyz/">X (formely twitter)</a>
                    <a target="_blank" href="https://github.com/devarogundade/orbital/">GitHub</a>
                </div>
            </footer>
        </div>
    </section>
</template>

<style scoped>
section {
    margin-top: 100px;
}

footer {
    background: var(--background-light);
    border-left: 4px solid var(--background-lighter);
    border-right: 4px solid var(--background-lighter);
    border-top: 4px solid var(--background-lighter);
    padding: 40px 40px 80px 40px;
    border-radius: 24px 24px 0 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
}

.page {
    min-width: 200px;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.page h3 {
    margin-bottom: 10px;
    font-size: 18px;
    color: var(--tx-normal);
}

.page a {
    font-size: 16px;
    color: var(--tx-dimmed);
}
</style>