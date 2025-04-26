// Sadece update fonksiyonu
function update(deltaTime) {
    console.log("Update fonksiyonu çalışıyor!");
    // Minimal bir güncelleme (bir şey yapmayacak)
}

// Sadece gameLoop fonksiyonu
function gameLoop(currentTime) {
    // Delta time hesaplama (basit versiyon)
    const deltaTime = currentTime - (gameLoop.lastTime || currentTime);
    gameLoop.lastTime = currentTime;

    console.log("Oyun döngüsü çalışıyor...");

    // Update fonksiyonunu çağır
    // Eğer 'update' tanımlı değilse hata burada fırlayacak
    update(deltaTime);

    // Döngüyü devam ettir
    requestAnimationFrame(gameLoop);
}

// Script başladığında console'a yaz ve gameLoop'u çağır
console.log("Test scripti başladı, gameLoop çağrılıyor...");
gameLoop(0); // İlk çağrı için zamanı 0 olarak başlat