const products = {};
const productCards = document.querySelectorAll(".product-card");

productCards.forEach(card => {
    const id = card.dataset.id;

    products[id] = {
        id: id,
        name: card.querySelector(".card-title").textContent.trim(),
        price: Number(card.dataset.price),
        image: card.querySelector(".product-image").getAttribute("src"),
        description: card.dataset.description
    };
});

let cart = {};

try {
    const savedCart = JSON.parse(localStorage.getItem("bloomCart")) || {};

    Object.keys(savedCart).forEach(id => {
        if (
            Object.hasOwn(products, id) &&
            Number.isInteger(savedCart[id]) &&
            savedCart[id] > 0
        ) {
            cart[id] = savedCart[id];
        }
    });
} catch {
    cart = {};
}

let selectedProduct = null;

const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const subtotalElement = document.getElementById("subtotal");
const shippingElement = document.getElementById("shipping");
const cartTotal = document.getElementById("cartTotal");

const deliveryMessage = document.getElementById("deliveryMessage");
const deliveryProgress = document.getElementById("deliveryProgress");
const deliveryBar = document.getElementById("deliveryBar");

const checkoutButton = document.getElementById("checkoutButton");
const clearCartButton = document.getElementById("clearCart");

const toastMessage = document.getElementById("toastMessage");
const shopToast = new bootstrap.Toast(
    document.getElementById("shopToast"),
    { delay: 3000 }
);

const freeDeliveryLimit = 2000;
const deliveryPrice = 150;

function formatPrice(price) {
    return `${price.toLocaleString("uk-UA")} грн`;
}

function saveCart() {
    try {
        localStorage.setItem("bloomCart", JSON.stringify(cart));
    } catch {}
}

function showToast(message) {
    toastMessage.textContent = message;
    shopToast.show();
}

function getSubtotal() {
    return Object.keys(cart).reduce((total, id) => {
        return total + products[id].price * cart[id];
    }, 0);
}

function getShipping(subtotal) {
    if (subtotal === 0 || subtotal >= freeDeliveryLimit) {
        return 0;
    }

    return deliveryPrice;
}

function getTotalQuantity() {
    return Object.values(cart).reduce((total, quantity) => {
        return total + quantity;
    }, 0);
}

function addToCart(id) {
    if (!Object.hasOwn(products, id)) {
        return;
    }

    cart[id] = (cart[id] || 0) + 1;

    updateCart();

    showToast(`«${products[id].name}» додано до кошика.`);
}

function removeFromCart(id) {
    if (!Object.hasOwn(cart, id)) {
        return;
    }

    delete cart[id];

    updateCart();

    showToast("Букет видалено з кошика.");
}

function changeQuantity(id, amount) {
    if (!Object.hasOwn(cart, id)) {
        return;
    }

    cart[id] += amount;

    if (cart[id] <= 0) {
        delete cart[id];
    }

    updateCart();
}

function updateCart() {
    cartItems.innerHTML = "";

    const ids = Object.keys(cart);

    if (ids.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="bi bi-bag"></i>
                <h3 class="h5">Твій кошик поки порожній</h3>
                <p>Обери квіти, які тобі до душі.</p>
            </div>
        `;
    } else {
        ids.forEach(id => {
            const product = products[id];
            const quantity = cart[id];

            const item = document.createElement("div");
            item.className = "cart-item";

            item.innerHTML = `
                <img src="${product.image}"
                     alt="${product.name}"
                     class="cart-item-image">

                <div class="cart-item-info">

                    <h3 class="cart-item-title">
                        ${product.name}
                    </h3>

                    <div class="cart-item-price">
                        ${formatPrice(product.price * quantity)}
                    </div>

                    <div class="d-flex align-items-center gap-2 mt-2">

                        <button class="quantity-button"
                                data-action="decrease"
                                data-id="${id}"
                                aria-label="Зменшити кількість">
                            <i class="bi bi-dash"></i>
                        </button>

                        <span>${quantity}</span>

                        <button class="quantity-button"
                                data-action="increase"
                                data-id="${id}"
                                aria-label="Збільшити кількість">
                            <i class="bi bi-plus"></i>
                        </button>

                    </div>

                </div>

                <button class="remove-button"
                        data-action="remove"
                        data-id="${id}"
                        aria-label="Видалити букет">

                    <i class="bi bi-trash"></i>

                </button>
            `;

            cartItems.appendChild(item);
        });
    }

    const subtotal = getSubtotal();
    const shipping = getShipping(subtotal);
    const total = subtotal + shipping;

    cartCount.textContent = getTotalQuantity();

    subtotalElement.textContent = formatPrice(subtotal);
    shippingElement.textContent = formatPrice(shipping);
    cartTotal.textContent = formatPrice(total);

    const progress = Math.min(
        Math.round(subtotal / freeDeliveryLimit * 100),
        100
    );

    deliveryBar.style.width = `${progress}%`;
    deliveryBar.textContent = `${progress}%`;

    deliveryProgress.setAttribute("aria-valuenow", progress);

    if (subtotal >= freeDeliveryLimit) {
        deliveryMessage.textContent = "Вітаємо! Доставка безкоштовна.";
        deliveryMessage.classList.add("text-success");
    } else {
        const remaining = freeDeliveryLimit - subtotal;

        deliveryMessage.textContent =
            `До безкоштовної доставки залишилось ${formatPrice(remaining)}.`;

        deliveryMessage.classList.remove("text-success");
    }

    checkoutButton.disabled = ids.length === 0;
    clearCartButton.disabled = ids.length === 0;

    saveCart();
}

document.querySelectorAll(".add-button").forEach(button => {
    button.addEventListener("click", () => {
        const card = button.closest(".product-card");

        addToCart(card.dataset.id);
    });
});

cartItems.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "increase") {
        changeQuantity(id, 1);
    }

    if (action === "decrease") {
        changeQuantity(id, -1);
    }

    if (action === "remove") {
        removeFromCart(id);
    }
});

clearCartButton.addEventListener("click", () => {
    cart = {};

    updateCart();

    showToast("Кошик очищено.");
});

const productModal = document.getElementById("productModal");

const modalTitle = document.getElementById("productModalTitle");
const modalImage = document.getElementById("modalImage");
const modalDescription = document.getElementById("modalDescription");
const modalPrice = document.getElementById("modalPrice");
const modalAdd = document.getElementById("modalAdd");

productModal.addEventListener("show.bs.modal", event => {
    const button = event.relatedTarget;
    const card = button?.closest(".product-card");

    if (!card) {
        return;
    }

    selectedProduct = card.dataset.id;

    const product = products[selectedProduct];

    modalTitle.textContent = product.name;
    modalImage.src = product.image;
    modalImage.alt = product.name;
    modalDescription.textContent = product.description;
    modalPrice.textContent = formatPrice(product.price);
});

modalAdd.addEventListener("click", () => {
    if (selectedProduct) {
        addToCart(selectedProduct);
    }
});

const filterButtons = document.querySelectorAll(".filter-button");
const productColumns = document.querySelectorAll(".product-column");

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        const selectedCategory = button.dataset.filter;

        filterButtons.forEach(filterButton => {
            filterButton.classList.remove("btn-bloom");
            filterButton.classList.add("btn-outline-secondary");
            filterButton.setAttribute("aria-pressed", "false");
        });

        button.classList.remove("btn-outline-secondary");
        button.classList.add("btn-bloom");
        button.setAttribute("aria-pressed", "true");

        productColumns.forEach(column => {
            const category = column.dataset.category;

            const isVisible =
                selectedCategory === "all" ||
                selectedCategory === category;

            column.classList.toggle("d-none", !isVisible);
        });
    });
});

const themeButton = document.getElementById("themeButton");
const html = document.documentElement;

function setTheme(theme) {
    html.setAttribute("data-bs-theme", theme);

    if (theme === "dark") {
        themeButton.innerHTML = `<i class="bi bi-sun"></i>`;
        themeButton.setAttribute(
            "aria-label",
            "Увімкнути світлу тему"
        );
    } else {
        themeButton.innerHTML = `<i class="bi bi-moon-stars"></i>`;
        themeButton.setAttribute(
            "aria-label",
            "Увімкнути темну тему"
        );
    }

    try {
        localStorage.setItem("bloomTheme", theme);
    } catch {}
}

themeButton.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-bs-theme");

    setTheme(currentTheme === "light" ? "dark" : "light");
});

let savedTheme = "light";

try {
    if (localStorage.getItem("bloomTheme") === "dark") {
        savedTheme = "dark";
    }
} catch {}

setTheme(savedTheme);

const cartPanel = document.getElementById("cartPanel");

checkoutButton.addEventListener("click", () => {
    cartPanel.addEventListener("hidden.bs.offcanvas", () => {
        document.getElementById("checkout").scrollIntoView({
            behavior: "smooth"
        });

        document.getElementById("customerName").focus({
            preventScroll: true
        });
    }, { once: true });
});

const orderForm = document.getElementById("orderForm");
const orderAlert = document.getElementById("orderAlert");

const customerName = document.getElementById("customerName");
const phone = document.getElementById("phone");
const address = document.getElementById("address");

function validatePhone() {
    const normalizedPhone = phone.value.replace(/[\s()-]/g, "");
    const phonePattern = /^(?:\+380|380|0)\d{9}$/;

    if (phonePattern.test(normalizedPhone)) {
        phone.setCustomValidity("");
    } else {
        phone.setCustomValidity("Некоректний номер телефону");
    }
}

phone.addEventListener("input", validatePhone);

function showOrderAlert(message, type) {
    orderAlert.className = `alert alert-${type}`;
    orderAlert.textContent = message;
}

orderForm.addEventListener("submit", event => {
    event.preventDefault();

    customerName.value = customerName.value.trim();
    phone.value = phone.value.trim();
    address.value = address.value.trim();

    customerName.setCustomValidity(
        customerName.value.length >= 2 ? "" : "Некоректне ім’я"
    );

    address.setCustomValidity(
        address.value.length >= 5 ? "" : "Некоректна адреса"
    );

    validatePhone();

    orderForm.classList.add("was-validated");

    if (!orderForm.checkValidity()) {
        showOrderAlert(
            "Перевірте правильність заповнення всіх обов’язкових полів.",
            "danger"
        );

        orderForm.querySelector(":invalid")?.focus();

        return;
    }

    if (Object.keys(cart).length === 0) {
        showOrderAlert(
            "Ваш кошик порожній. Спочатку оберіть букет.",
            "warning"
        );

        return;
    }

    const subtotal = getSubtotal();
    const total = subtotal + getShipping(subtotal);
    const name = customerName.value;

    showOrderAlert(
        `${name}, ваше замовлення на суму ` +
        `${formatPrice(total)} успішно оформлено!`,
        "success"
    );

    cart = {};

    updateCart();

    orderForm.reset();
    phone.setCustomValidity("");
    customerName.setCustomValidity("");
    address.setCustomValidity("");

    orderForm.classList.remove("was-validated");

    showToast("Замовлення успішно оформлено.");
});

customerName.addEventListener("input", () => {
    customerName.setCustomValidity(
        customerName.value.trim().length >= 2
            ? ""
            : "Некоректне ім’я"
    );
});

address.addEventListener("input", () => {
    address.setCustomValidity(
        address.value.trim().length >= 5
            ? ""
            : "Некоректна адреса"
    );
});

const navigation = document.getElementById("navigation");

document.querySelectorAll(".navbar .nav-link").forEach(link => {
    link.addEventListener("click", () => {
        if (navigation.classList.contains("show")) {
            bootstrap.Collapse.getOrCreateInstance(navigation, {
                toggle: false
            }).hide();
        }
    });
});

updateCart();