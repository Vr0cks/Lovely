// Sürpriz müziği oynatma
function playSurprise() {
    const audio = document.getElementById("player");
    audio.style.display = "block";
    audio.play();
}

// DOMContentLoaded olayları
window.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("player");
    const slider = document.getElementById("volumeSlider");

    audio.volume = parseFloat(slider.value);

    slider.addEventListener("input", () => {
        audio.volume = parseFloat(slider.value);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("player");
    const slider = document.getElementById("volumeSlider");
    const button = document.getElementById("playButton");
    const volumeDiv = document.querySelector(".volume-control");

    button.addEventListener("click", () => {
        audio.volume = parseFloat(slider.value);
        audio.play().then(() => {
            button.style.display = "none";
            volumeDiv.style.display = "block";
        }).catch((e) => {
            console.log("Oynatma hatası:", e);
        });
    });

    slider.addEventListener("input", () => {
        audio.volume = parseFloat(slider.value);
    });
});

// Yeni eklenen işlevler
const music = document.getElementById("bgMusic");
const playBtn = document.getElementById("playBtn");
const gameBtn = document.getElementById("startGameBtn");

// Arka plan müziğini oynatma
playBtn.addEventListener("click", () => {
    music.volume = 0.2;
    music.play();
});

// Oyuna başlama butonu
gameBtn.addEventListener("click", () => {
    window.location.href = "game.html"; // oyun sayfasına yönlendirme
});
