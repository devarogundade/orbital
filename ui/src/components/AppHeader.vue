<template>
    <section>
        <div class="app_width">
            <header>
                <div class="logo">
                    <img src="/images/logo.svg" alt="">
                </div>

                <div class="tabs">
                    <RouterLink to="/">
                        <button :class="$route.name == 'home' ? 'tab active' : 'tab'">../</button>
                    </RouterLink>
                    <RouterLink to="/borrow">
                        <button :class="$route.name == 'borrow' ? 'tab active' : 'tab'">Borrow</button>
                    </RouterLink>
                    <RouterLink to="/earn">
                        <button :class="$route.name == 'earn' ? 'tab active' : 'tab'">Earn</button>
                    </RouterLink>
                </div>

                <div class="action">
                    <RouterLink to="/borrow">
                        <button class="connect">Launch App</button>
                    </RouterLink>
                </div>
            </header>
        </div>
    </section>
</template>

<style scoped>
section {
    position: sticky;
    top: 0;
    z-index: 10;
}

header {
    width: 100%;
    height: 100px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo,
.action {
    min-width: 200px;
}

.tabs {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    background: var(--background-light);
    border-radius: 8px;
}

.tab {
    padding: 0 20px;
    height: 45px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 4px;
    color: var(--tx-dimmed);
}

.tab.active {
    color: var(--tx-normal);
    background: var(--background-lighter);
}

.action {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}

.action button {
    height: 45px;
    width: 160px;
    border-radius: 16px;
    background: var(--primary);
    font-size: 18px;
    font-weight: 500;
    color: var(--tx-normal);
}
</style>