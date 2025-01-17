declare global {
    interface Window {
        Alpine: typeof import("alpinejs");
    }

    const Alpine: typeof import("alpinejs"); // If directly accessible as a global
}

export {}; // Ensures the file is treated as a module
