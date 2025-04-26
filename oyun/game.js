// Canvas elementini ve 2D çizim context'ini al
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas'ın genişlik ve yükseklik ayarları
canvas.width = 640;
canvas.height = 480;

// Oyunun genel durumu ve ayarları
const game = {
    // Oyun durumu: 'loading' (assetler yükleniyor), 'readyToPlay' (yüklendi, başla komutu bekleniyor),
    // 'playing' (oyun aktif), 'gameOver' (oyun bitti), 'win' (oyun kazanıldı)
    gameState: 'loading',
    stage: 1, // Oyun aşaması
    health: 1, // Başlangıç canı
    score: 0, // Belki toplanan kalp sayısı gibi kullanılabilir
    lastTime: 0, // Oyun döngüsü zaman takibi için (delta time hesaplamak için)
    bulletSpawnTimer: 0, // Mermi oluşturmak için zamanlayıcı
    bulletSpawnInterval: 500, // Mermi oluşturma aralığı (milisaniye cinsinden)
    heartSpawnTimer: 0, // Kalp oluşturmak için zamanlayıcı
    heartSpawnInterval: 5000, // Kalp oluşturma aralığı (milisaniye)
    bullets: [], // Aktif mermi objelerini tutan dizi
    hearts: [],  // Aktif kalp objelerini tutan dizi
    assetsLoaded: 0, // Yüklenen asset sayısı
    totalAssets: 9, // Toplam asset sayısı: Oyuncu, Sevgili, Kalp, Mermi, Fotoğraf, 3 Arka Plan, Müzik
    allAssetsLoaded: false, // Tüm assetlerin yüklenip yüklenmediğini belirten bayrak
    backgrounds: {} // Aşama numaralarına göre arka plan görsel objelerini tutan obje
    // Canvas dışı body arka plan rengi HTML/CSS ile ayarlanıyor, buradan kaldırıldı.
};

// --- Asset (Görsel ve Ses) Yükleme ---
const playerImage = new Image();
playerImage.src = './assets/img/player1.png'; // Ana karakter görseli

const loverImage = new Image();
loverImage.src = './assets/img/player2.png'; // Sevgili görseli

const heartImage = new Image();
heartImage.src = './assets/img/heart.png'; // Kalp görseli

const bulletImage = new Image();
bulletImage.src = './assets/img/bullet_v2.png'; // Mermi görseli (Doğru mermi görseli yolunu buraya koyun)

const winPhoto = new Image();
winPhoto.src = './assets/img/our_photo.png'; // Kazanma ekranı fotoğrafı

// Aşama arka plan görselleri
const background1 = new Image();
background1.src = './assets/img/background_stage1.png'; // Aşama 1 arka planı

const background2 = new Image();
background2.src = './assets/img/background_stage2.png'; // Aşama 2 arka planı

const background3 = new Image();
background3.src = './assets/img/background_stage3.png'; // Aşama 3 arka planı

// Arka plan müziği
const bgMusic = new Audio();
bgMusic.src = './assets/audio/background_music.mp3'; // Müzik dosyası (Doğru müzik dosyası yolunu buraya koyun)
bgMusic.loop = true; // Müziği döngüye al
bgMusic.volume = 0.5; // Ses seviyesi (0.0 - 1.0 arası)

// Yüklenecek tüm assetleri bir dizi içinde topluyoruz.
// Her asset için bir isim, tipi, ilgili objesi (Image/Audio) ve src yolu bilgisi tutulur.
const assets = [
    { name: 'player', type: 'image', image: playerImage, src: playerImage.src },
    { name: 'lover', type: 'image', image: loverImage, src: loverImage.src },
    { name: 'heart', type: 'image', image: heartImage, src: heartImage.src },
    { name: 'bullet', type: 'image', image: bulletImage, src: bulletImage.src }, // Mermi asseti
    { name: 'winPhoto', type: 'image', image: winPhoto, src: winPhoto.src },
    { name: 'background1', type: 'image', image: background1, src: background1.src },
    { name: 'background2', type: 'image', image: background2, src: background2.src },
    { name: 'background3', type: 'image', image: background3, src: background3.src },
    { name: 'bgMusic', type: 'audio', audio: bgMusic, src: bgMusic.src } // Audio asset
];

// Arka plan görsel objelerini, aşama numaralarına kolay erişim için game objesine ekliyoruz.
game.backgrounds = {
    1: background1,
    2: background2,
    3: background3
};

// Asset yükleme işlemini başlatan fonksiyon
function loadAssets() {
     assets.forEach(asset => {
         console.log(`[ASSET] Yükleniyor: ${asset.src}`); // Debug: Hangi dosya yüklenmeye başlandı

         if (asset.type === 'image') {
             // Görsel yüklendiğinde
             asset.image.onload = () => {
                 console.log(`[ASSET] ${asset.name} görseli yüklendi!`);
                 game.assetsLoaded++; // Yüklenen asset sayacını artır
                 checkAssetsLoaded(); // Yükleme tamamlandı mı kontrol et
             };
             // Görsel yüklenemediğinde
             asset.image.onerror = () => {
                 console.error(`[ASSET] ${asset.name} görseli yüklenemedi! Yol: ${asset.src}`);
                 // Hata olsa bile sayacı artır ki oyun yüklenmede takılı kalmasın, hata durumunda yedek çizim kullanılır.
                 game.assetsLoaded++;
                 checkAssetsLoaded();
             };
         } else if (asset.type === 'audio') {
             // Ses dosyası çalmaya hazır olduğunda
             asset.audio.addEventListener('canplaythrough', () => {
                 console.log(`[ASSET] ${asset.name} müzik yüklendi (canplaythrough)!`);
                 game.assetsLoaded++; // Yüklenen asset sayacını artır
                 checkAssetsLoaded(); // Yükleme tamamlandı mı kontrol et
             });
             // Ses dosyası metadata yüklendiğinde (tamamı değil)
             asset.audio.addEventListener('loadeddata', () => {
                 console.log(`[ASSET] ${asset.name} müzik yüklendi (loadeddata)!`);
                 // Sayacı burada artırma, canplaythrough'ta artıyor zaten
             });
              // Ses dosyası yüklenemediğinde
              asset.audio.addEventListener('error', (e) => {
                  console.error(`[ASSET] ${asset.name} müzik yüklenemedi! Yol: ${asset.src}`, e);
                   // Hata olsa bile sayacı artır
                  game.assetsLoaded++;
                  checkAssetsLoaded();
              });
             // Bazı tarayıcılarda yüklemeyi başlatmak için load() çağrısı gerekebilir
             asset.audio.load();
         }
     });
}

// Tüm assetlerin yüklenip yüklenmediğini kontrol eden fonksiyon
function checkAssetsLoaded() {
    console.log(`[ASSET] Yüklenen asset sayısı: ${game.assetsLoaded}/${game.totalAssets}`); // Debug: Yükleme durumu takibi
    // Yüklenen asset sayısı toplam asset sayısına eşit veya fazlaysa (hata durumunda fazla olabilir)
    if (game.assetsLoaded >= game.totalAssets) {
        game.allAssetsLoaded = true; // Tüm assetler yüklendi bayrağını true yap
        game.gameState = 'readyToPlay'; // Oyun durumunu 'oynamaya hazır' olarak ayarla
        console.log("[ASSET] Tüm assetler yüklendi. Oyun oynamaya hazır.");
        console.log(`[GAME] Oyun durumu: ${game.gameState}`); // Debug: Oyun durumu değişti mi?

        // Oyun döngüsü zaten requestAnimationFrame ile başlatılıyor, burada tekrar çağırmaya gerek yok.
        // Müzik ilk kullanıcı etkileşiminde başlayacak.
    }
}

// --- Oyuncu Objesi ---
// Oyuncu karakterinin özellikleri
const player = {
    x: 50, // Başlangıç x konumu
    y: canvas.height / 2 - 16, // Başlangıç y konumu (Canvas yüksekliğinin ortası)
    width: 32, // Genişlik (görsel boyutuna göre ayarla)
    height: 32, // Yükseklik (görsel boyutuna göre ayarla)
    speed: 4, // Hareket hızı
    dx: 0, // x yönündeki hareket vektörü
    dy: 0, // y yönündeki hareket vektörü
    image: playerImage // Oyuncu görsel objesi
};

// --- Sevgili Objesi ---
// Sevgili karakterinin özellikleri (Aşama 3'te görünür)
const lover = {
    x: canvas.width - 50 - 64, // x konumu (Canvas'ın sağ tarafı)
    y: canvas.height / 2 - 64, // y konumu (Canvas yüksekliğinin ortası)
    width: 64, // Genişlik (görsel boyutuna göre ayarla)
    height: 64, // Yükseklik (görsel boyutuna göre ayarla)
    image: loverImage, // Sevgili görsel objesi
    active: false // Aşama 3'te true olur
};

// --- Mermi Objesi Sınıfı ---
// Mermi özelliklerini ve davranışlarını tanımlayan sınıf
class Bullet {
    constructor(x, y, speed, direction) {
        this.x = x; // Başlangıç x konumu
        this.y = y; // Başlangıç y konumu
        this.width = 20; // Genişlik (görsel boyutuna göre ayarla)
        this.height = 8; // Yükseklik (görsel boyutuna göre ayarla)
        this.speed = speed; // Hareket hızı
        this.direction = direction; // Hareket yönü ('left' veya 'right')
        this.image = bulletImage; // Mermi görsel objesi
        console.log(`[BULLET] Yeni mermi objesi oluşturuldu. Başlangıç Konum: ${this.x}, ${this.y}, Yön: ${this.direction}`); // Debug: Obje oluştuğunda konum ve yönü logla
    }

    // Merminin durumunu (konumunu) günceller
    update() {
        if (this.direction === 'right') {
            this.x += this.speed; // Sağa hareket
        } else { // direction === 'left'
            this.x -= this.speed; // Sola hareket
        }
    }

    // Mermiyi Canvas'a çizer
    draw(ctx) {
        if (this.image && this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// --- Kalp Objesi Sınıfı ---
// Kalp özelliklerini ve davranışlarını tanımlayan sınıf (Toplanabilir can)
class Heart {
    constructor(x, y) {
        this.x = x; // Başlangıç x konumu
        this.y = y; // Başlangıç y konumu
        this.width = 24; // Genişlik (görsel boyutuna göre ayarla)
        this.height = 24; // Yükseklik (görsel boyutuna göre ayarla)
        this.image = heartImage; // Kalp görsel objesi
        this.collected = false; // Toplanıp toplanmadığını belirten bayrak
    }

    // Kalbi Canvas'a çizer
    draw(ctx) {
         // console.log(`[DRAW] Kalp çizilmeye çalışılıyor. Konum: ${this.x}, ${this.y}. Görsel yüklü mü: ${this.image && this.image.complete}`); // Debug
        // Görsel objesi varsa ve yüklüyse görseli çiz
        if (this.image && this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
             // Görsel yüklenmediyse veya bulunamadıysa geçici pembe kare çiz
             ctx.fillStyle = 'pink';
             ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// --- Klavye Girişleri ---
// Hangi tuşların basılı olduğunu takip eden obje
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, s: false, a: false, d: false
};

// Müzik ve oyun başlama için ilk kullanıcı etkileşimi bayrağı
let firstInteraction = false;

// Tuşa basıldığında çalışır
window.addEventListener('keydown', (e) => {
    // Basılan tuş 'keys' objesinde tanımlıysa
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true; // İlgili tuşun durumunu true yap
        e.preventDefault(); // Tarayıcının varsayılan davranışını engelle (örn: ok tuşlarıyla scroll)

        // Eğer ilk etkileşim henüz gerçekleşmediyse
        if (!firstInteraction) {
             // Müzik çalmaya hazırsa (yüklendiyse)
             if (bgMusic.readyState >= 2) { // readyState 2: HAVE_CURRENT_DATA
                  // Müziği çalmaya çalış, hata olursa logla (tarayıcı engeli gibi)
                  bgMusic.play().catch(err => console.error("[AUDIO] Müzik çalma hatası:", err));
             } else {
                  console.log("[AUDIO] Müzik henüz çalmaya hazır değil."); // Debug
             }

             // Eğer oyun durumu 'oynamaya hazır' ise (assetler yüklendi ama başla komutu bekleniyor)
             if (game.gameState === 'readyToPlay') {
                 game.gameState = 'playing'; // Oyun durumunu 'oyun aktif' olarak değiştir
                 console.log(`[GAME] Oyun durumu 'readyToPlay' -> 'playing' olarak değişti. Oyun başladı!`); // Debug
             }

             firstInteraction = true; // İlk etkileşim gerçekleşti olarak işaretle
             console.log("[GAME] İlk kullanıcı etkileşimi algılandı."); // Debug
        }
    }
});

// Tuş bırakıldığında çalışır
window.addEventListener('keyup', (e) => {
    // Bırakılan tuş 'keys' objesinde tanımlıysa
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false; // İlgili tuşun durumunu false yap
    }
});

// --- Çarpışma Kontrolü ---
// İki dikdörtgenin çarpışıp çarpışmadığını kontrol eder
function areColliding(rect1, rect2) {
    // Dikdörtgenler x ekseninde ve y ekseninde çakışıyorsa çarpışma var demektir.
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// --- Oyun Mantığı Güncelleme ---
// Oyunun durumunu (karakterlerin konumu, mermi oluşturma, çarpışma vb.) her frame günceller
function update(deltaTime) {
    // Sadece 'playing' durumundaysa oyun mantığını güncelle
    if (game.gameState !== 'playing') return;
     // console.log(`[UPDATE] Update çağrıldı. DeltaTime: ${deltaTime}`); // Debug

    // Oyuncu hareketini güncelle
    player.dx = 0; // x hareket vektörünü sıfırla
    player.dy = 0; // y hareket vektörünü sıfırla

    // Tuş durumlarına göre hareket vektörlerini ayarla
    if (keys.ArrowUp || keys.w) {
        player.dy = -player.speed; // Yukarı hareket
    }
    if (keys.ArrowDown || keys.s) {
        player.dy = player.speed; // Aşağı hareket
    }
    if (keys.ArrowLeft || keys.a) {
        player.dx = -player.speed; // Sol hareket
    }
    if (keys.ArrowRight || keys.d) {
        player.dx = player.speed; // Sağ hareket
    }

    // Çapraz hareket ediyorsa hızı düşür (diagonalSpeed)
     if (player.dx !== 0 && player.dy !== 0) {
        const diagonalSpeed = player.speed / Math.sqrt(2);
        player.dx = Math.sign(player.dx) * diagonalSpeed; // İşaretini koruyarak hızı ayarla
        player.dy = Math.sign(player.dy) * diagonalSpeed; // İşaretini koruyarak hızı ayarla
    }

    // Yeni pozisyonu hesapla
    const nextX = player.x + player.dx;
    const nextY = player.y + player.dy;

    // Karakterin Canvas sınırları içinde kalmasını sağla
     const padding = 10; // Kenarlardan ne kadar içeride durabilir
     // x ekseni kontrolü
     if (nextX > padding && nextX + player.width < canvas.width - padding) {
          player.x = nextX; // Sınırlar içindeyse yeni konumu uygula
     } else {
         // Sınır dışına çıkıyorsa pozisyonu sınıra sabitle
         if (nextX <= padding) player.x = padding;
         if (nextX + player.width >= canvas.width - padding) player.x = canvas.width - player.width - padding;
     }
     // y ekseni kontrolü
     if (nextY > padding && nextY + player.height < canvas.height - padding) {
         player.y = nextY; // Sınırlar içindeyse yeni konumu uygula
     } else {
         if (nextY <= padding) player.y = padding;
         if (nextY + player.height >= canvas.height - padding) player.y = canvas.height - player.height - padding;
     }

    // --- Mermi Yönetimi ---
    game.bulletSpawnTimer += deltaTime; // Zamanlayıcıyı artır
     // console.log(`[UPDATE] Bullet Timer: ${game.bulletSpawnTimer.toFixed(2)}, Interval: ${game.bulletSpawnInterval}`); // Debug: Timer'ı gör

    // Eğer zamanlayıcı aralığı aştıysa yeni mermi oluştur
    if (game.bulletSpawnTimer >= game.bulletSpawnInterval) {
        console.log("[GAME] Mermi Spawn Denemesi! Timer >= Interval"); // Debug
        const startSide = Math.random() < 0.5 ? 'left' : 'right'; // Rastgele başlangıç tarafı
        // BAŞLANGIÇ KONUMUNU DÜZELTTİK: Ekran kenarından biraz daha uzak başlatıyoruz
        const startX = startSide === 'left' ? -50 : canvas.width + 50; // -30 yerine -50, +30 yerine +50

        const startY = Math.random() * canvas.height; // Rastgele y konumu
        const bulletSpeed = 3 + Math.random() * 2; // Rastgele hız

        game.bullets.push(new Bullet(startX, startY, bulletSpeed, startSide)); // Yeni mermiyi diziye ekle
        game.bulletSpawnTimer = 0; // Zamanlayıcıyı sıfırla
         console.log(`[GAME] Yeni mermi oluşturuldu ve diziye eklendi. Toplam mermi (push sonrası): ${game.bullets.length}`); // Debug: Dizi boyutu ne oldu?

         // Aşama değiştikçe mermi sıklığı/hızı artışı
         if (game.stage === 2) game.bulletSpawnInterval = 400; // Daha sık
         if (game.stage === 3) game.bulletSpawnInterval = 300; // Daha da sık
         // Not: Bu interval ayarı timer sıfırlanmadan yapıldığı için hemen etkili olur.
    }

     console.log(`[UPDATE] Update çağrıldı. Mermileri güncellemeden önce dizi boyutu: ${game.bullets.length}`); // Debug: Update başında dizi boyutu
    game.bullets.forEach(bullet => bullet.update()); // Dizideki her merminin konumunu güncelle

     console.log(`[UPDATE] Mermiler güncellendi. Filtrelemeden önce dizi boyutu: ${game.bullets.length}`); // Debug: Update sonunda dizi boyutu

    // Mermileri ekran dışına çıkınca veya diğer sebeplerle sil (filtrele)
    const initialBulletCount = game.bullets.length; // Silmeden önceki sayı
    game.bullets = game.bullets.filter(bullet => {
        let isOffscreen = false;
        // FİLTRELEME MANTIĞINI DÜZELTTİK: Mermi sadece hareket ettiği yönün tersine çıkarsa silinir
        if (bullet.direction === 'right') {
             // Sağa giden mermi, Canvas'ın sağ kenarından kendi genişliği kadar sağa geçtiyse sil
             isOffscreen = bullet.x > canvas.width + bullet.width;
        }
        // Eğer mermi sola gidiyorsa (direction === 'left'), sadece soldan çıkınca sil
        else if (bullet.direction === 'left') {
             // Sola giden mermi, Canvas'ın sol kenarından kendi genişliği kadar sola geçtiyse sil
             isOffscreen = bullet.x < -bullet.width;
        }

        if (isOffscreen) {
             console.log(`[BULLET] Mermi ekran dışına çıktı ve yönüne göre siliniyor. Konum: ${bullet.x.toFixed(2)}, Yön: ${bullet.direction}, Canvas Genişlik: ${canvas.width}, Mermi Genişlik: ${bullet.width}`); // Debug: Siliniyorsa neden silindiğini logla (konumu düzgün formatla)
        }
        return !isOffscreen; // Ekran dışında değilse (kalmalı) -> true döndürür. Ekran dışındaysa (silinmeli) -> false döndürür.
    });
     if (game.bullets.length < initialBulletCount) {
         console.log(`[GAME] Mermi silindi. Kalan mermi sayısı (filtre sonrası): ${game.bullets.length}`); // Debug: Silinme olduysa logla
     }
     // console.log(`[UPDATE] Update sonunda aktif mermi sayısı (filtre sonrası): ${game.bullets.length}`); // Debug


    // --- Kalp Yönetimi ---
    game.heartSpawnTimer += deltaTime;
    let currentHeartInterval = game.stage === 1 ? 5000 : game.stage === 2 ? 10000 : -1; // Aşama 3'te kalp spawn etmez

    if (currentHeartInterval !== -1 && game.heartSpawnTimer >= currentHeartInterval) {
         console.log("[GAME] Kalp Spawn Denemesi!"); // Debug
         const heartX = Math.random() * (canvas.width - 32);
         const heartY = Math.random() * (canvas.height - 32);
         game.hearts.push(new Heart(heartX, heartY));
         game.heartSpawnTimer = 0;
          console.log(`[GAME] Yeni kalp oluşturuldu. Toplam kalp: ${game.hearts.length}`); // Debug
    }

    // --- Çarpışma Kontrolleri ---
    // Mermi Çarpışması (diziyi tersten döngülemek silme sırasında güvenlidir)
    for (let i = game.bullets.length - 1; i >= 0; i--) {
        const bullet = game.bullets[i];
        if (areColliding(player, bullet)) {
            game.health--; // Canı azalt
            console.log("[GAME] Mermiye çarptın! Can: " + game.health);
            game.bullets.splice(i, 1); // Çarpan mermiyi diziden sil
            if (game.health <= 0) {
                game.gameState = 'gameOver'; // Can 0 ise oyun bitti
                console.log("[GAME] Oyun Bitti!");
                 if(bgMusic && bgMusic.readyState >= 2) bgMusic.pause(); // Müziği durdur
            }
        }
    }

     // Kalp Çarpışması (diziyi tersten döngülemek silme sırasında güvenlidir)
     for (let i = game.hearts.length - 1; i >= 0; i--) {
        const heart = game.hearts[i];
         // Kalp henüz toplanmadıysa ve oyuncu ile çarpışma varsa
         if (areColliding(player, heart) && !heart.collected) {
             game.health++; // Canı artır
             heart.collected = true; // Kalbi toplandı olarak işaretle (gerekmeyebilir çünkü siliniyor)
             console.log("[GAME] Kalp topladın! Can: " + game.health);
             game.hearts.splice(i, 1); // Toplanan kalbi diziden sil
         }
     }

    // --- Aşama Geçişleri ---
    if (game.stage === 1 && game.health >= 5) { // Aşama 1'den 2'ye geçiş şartı (örnek)
        game.stage = 2; // Aşama numarasını artır
        game.heartSpawnInterval = 10000; // Aşama 2 kalp spawn süresi (örnek)
        game.bulletSpawnInterval = 400; // Aşama 2 mermi spawn sıklığı (örnek)
        game.bulletSpawnTimer = 0; // Timer'ı sıfırla ki hemen mermi spawn olmasın
        console.log("[GAME] Aşama 2'ye geçildi!");
    } else if (game.stage === 2 && game.health >= 10) { // Aşama 2'den 3'e geçiş şartı (örnek)
        game.stage = 3; // Aşama numarasını artır
        lover.active = true; // Sevgiliyi aktif et
        game.bullets = []; // 3. aşamada mermileri temizle (konsept böyleyse)
        game.bulletSpawnInterval = 300; // Aşama 3 mermi spawn sıklığı (eğer mermiler devam edecekse)
        game.bulletSpawnTimer = 0; // Timer'ı sıfırla
        console.log("[GAME] Aşama 3'e geçildi! Sevgili ekranda.");
    }

    // --- Aşama 3 Kazanma Kontrolü (Oyuncu - Sevgili Çarpışması) ---
    if (game.stage === 3 && lover.active) { // Aşama 3'te sevgili aktifse
        if (areColliding(player, lover)) { // Oyuncu sevgiliye çarptıysa
            game.gameState = 'win'; // Oyun durumunu 'kazanıldı' yap
            console.log("[GAME] Oyunu Kazandın!");
            if(bgMusic && bgMusic.readyState >= 2) bgMusic.pause(); // Müziği durdur
            // Kazanma animasyonu ve ekranı burada başlayacak
        }
    }
}

// --- Çizim Fonksiyonu ---
// Oyun durumuna göre ekrana çizim yapar
function draw() {
     // Debug: draw fonksiyonu çağrıldı mı ve hangi durumda? Context geçerli mi?
     console.log(`[DRAW] Draw çağrıldı. Oyun durumu: ${game.gameState}. Context geçerli: ${!!ctx}`);

    // Arka planı çiz
    const currentBackground = game.backgrounds[game.stage]; // Mevcut aşamanın arka plan görselini al
     // Debug: Arka plan görselinin yüklenme durumu
     console.log(`[DRAW] Aşama ${game.stage} arka planı için: Obje var mı: ${!!currentBackground}, Yüklü mü: ${currentBackground && currentBackground.complete}`);
    if (currentBackground && currentBackground.complete) {
         // Görsel yüklüyse çiz
         ctx.drawImage(currentBackground, 0, 0, canvas.width, canvas.height);
    } else {
        // Yüklenmediyse veya bulunamadıysa Canvas'ın içini siyah doldur
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Yüklenme ekranı çizimi
    if (game.gameState === 'loading') {
         ctx.fillStyle = 'white';
         ctx.font = '20px Arial';
         ctx.textAlign = 'center';
         ctx.fillText('Yükleniyor...', canvas.width / 2, canvas.height / 2);
         // Asset yüklenme yüzdesini de gösterebiliriz (game.assetsLoaded / game.totalAssets * 100)
         // console.log("[DRAW] 'loading' ekranı çiziliyor."); // Debug
         return; // Yükleniyorsa başka bir şey çizme
    }

     // Oynamaya hazır ekranı çizimi (İlk tuşa basılmasını bekleyen ekran)
     if (game.gameState === 'readyToPlay') {
         // Arka plan zaten çizildi
         ctx.fillStyle = 'white';
         ctx.font = '20px Arial';
         ctx.textAlign = 'center';
         // Kullanıcıya oyunu başlatması için mesaj
         ctx.fillText('Başlamak için herhangi bir tuşa bas', canvas.width / 2, canvas.height / 2);
          // UI elementlerini de çizebiliriz (Can, Aşama)
          ctx.textAlign = 'left';
          const uiPadding = 15;
          ctx.fillText('Can: ' + game.health, uiPadding, uiPadding + 15);
          ctx.fillText('Aşama: ' + game.stage, uiPadding, uiPadding + 40);
         // console.log("[DRAW] 'readyToPlay' ekranı çiziliyor."); // Debug
         return; // Hazır ama başlamadıysa sadece bu ekranı çiz
     }

    // Oyun durumu 'playing', 'gameOver', veya 'win' ise ana oyun elementlerini çiz
    if (game.gameState === 'playing' || game.gameState === 'gameOver' || game.gameState === 'win') {
         // console.log(`[DRAW] Oyun durumu ${game.gameState}, ana oyun elementleri çiziliyor.`); // Debug

        // Oyuncuyu çiz
         // Debug: Oyuncu görselinin yüklenme durumu
         console.log(`[DRAW] Oyuncu için: Obje var mı: ${!!player.image}, Yüklü mü: ${player.image && player.image.complete}`);
        if (player.image && player.image.complete) {
            // Görsel yüklüyse çiz
            ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
        } else { // Görsel yüklenmediyse geçici kare
             ctx.fillStyle = 'cyan';
             ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        // Mermileri çiz
        console.log(`[DRAW] Çizim döngüsü başında toplam mermi nesnesi (game.bullets.length): ${game.bullets.length}`); // Debug: Dizide kaç mermi var
        game.bullets.forEach(bullet => {
            bullet.draw(ctx); // Her merminin draw metodunu çağır (kendi içinde görsel/kare çizer)
        });

        // Kalpleri çiz
        console.log(`[DRAW] Çizim döngüsü başında toplam kalp nesnesi (game.hearts.length): ${game.hearts.length}`); // Debug
        game.hearts.forEach(heart => heart.draw(ctx)); // Her kalbin draw metodunu çağır (kendi içinde görsel/kare çizer)

        // Aşama 3'te sevgiliyi çiz
        if (game.stage === 3 && lover.active) {
             // Debug: Sevgili görselinin yüklenme durumu
             console.log(`[DRAW] Sevgili için (Aşama 3 aktif): Obje var mı: ${!!lover.image}, Yüklü mü: ${lover.image && lover.image.complete}`);
             if (lover.image && lover.image.complete) {
                // Görsel yüklüyse çiz
                ctx.drawImage(lover.image, lover.x, lover.y, lover.width, lover.height);
             } else { // Aktif ama görsel yüklenmediyse geçici kare
                  ctx.fillStyle = 'purple';
                  ctx.fillRect(lover.x, lover.y, lover.width, lover.height);
             }
        }

        // UI Elementleri (Can, Aşama) çizimi
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        const uiPadding = 15;
        ctx.fillText('Can: ' + game.health, uiPadding, uiPadding + 15);
        ctx.fillText('Aşama: ' + game.stage, uiPadding, uiPadding + 40);
    }

    // --- Oyun Durumlarına Göre Ekranlar ---

    // Game Over ekranı çizimi
    if (game.gameState === 'gameOver') {
        // Arka planı tekrar çiz (Game Over olduğunda hangi aşamadaysak o arkaplanı çizelim)
        const currentBackground = game.backgrounds[game.stage];
         if (currentBackground && currentBackground.complete) {
              ctx.drawImage(currentBackground, 0, 0, canvas.width, canvas.height);
         } else {
             ctx.fillStyle = '#000';
             ctx.fillRect(0, 0, canvas.width, canvas.height);
         }
        // Yarı saydam siyah overlay çiz
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // "Oyun Bitti!" metnini çiz
        ctx.fillStyle = 'red';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Oyun Bitti!', canvas.width / 2, canvas.height / 2);
         // Yeniden başlama talimatı
         ctx.font = '20px Arial';
         ctx.textAlign = 'center';
        ctx.fillText('Yeniden başlamak için sayfayı yenile', canvas.width / 2, canvas.height / 2 + 30);
    }

    // Kazanma ekranı çizimi
    if (game.gameState === 'win') {
        // Arka planı çiz (Aşama 3 veya son aşama arka planı)
        const winBackground = game.backgrounds[3]; // Aşama 3 arka planını dene
        if (winBackground && winBackground.complete) {
             ctx.drawImage(winBackground, 0, 0, canvas.width, canvas.height);
        } else {
             // Aşama 3 arka planı yoksa, son oynanan aşamanın arka planını dene
             const lastStageBackground = game.backgrounds[game.stage];
             if(lastStageBackground && lastStageBackground.complete) {
                 ctx.drawImage(lastStageBackground, 0, 0, canvas.width, canvas.height);
             } else {
                   // O da yoksa mavi renk çiz (Kazanma teması için)
                   ctx.fillStyle = '#00f';
                   ctx.fillRect(0, 0, canvas.width, canvas.height);
             }
        }

        // Ortak fotoğrafı çiz
        // winPhoto objesi tanımlıysa ve görsel yüklüyse çiz
        if (winPhoto && winPhoto.complete) {
             const photoWidth = 200;
             const photoHeight = (winPhoto.height / winPhoto.width) * photoWidth;
             ctx.drawImage(winPhoto,
                           canvas.width / 2 - photoWidth / 2,
                           canvas.height / 2 - photoHeight / 2,
                           photoWidth, photoHeight);
        } else { // Yüklenmediyse geçici kare
             ctx.fillStyle = 'yellow';
             ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 - 100, 200, 200);
        }

        // Kazanma Metni çiz
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Başardın!', canvas.width / 2, 50);

        // TODO: Havai fişek ve resim patlama efektleri buraya eklenecek
    }
}

// --- Oyun Döngüsü ---
// Oyunun ana döngüsü. Sürekli tekrar ederek oyunu günceller ve çizer.
function gameLoop(currentTime) {
    // Delta time hesaplama (bir önceki frame'den bu frame'e ne kadar süre geçti)
    const deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;

    // Update fonksiyonu sadece oyun 'playing' durumundaysa çalışır.
    // Diğer durumlarda (loading, readyToPlay, gameOver, win) sadece draw çağrılır.
    if (game.gameState === 'playing') {
         update(deltaTime); // Oyun mantığını güncelle
    }

    // Çizimi her frame yap
    draw(); // Ekranı yeniden çiz

    // Oyun bitmediyse veya kazanılmadıysa, bir sonraki frame için gameLoop'u tekrar çağır
    if (game.gameState !== 'gameOver' && game.gameState !== 'win') {
         requestAnimationFrame(gameLoop);
    }
}

// --- Oyunu Başlat ---
// Oyun başladığında ilk yapılacaklar
console.log("[GAME] Assetler yükleniyor...");
loadAssets(); // Asset yükleme işlemini başlat
// İlk oyun döngüsü çağrısını başlat. Bu, yükleme ekranını hemen göstermeye başlar.
requestAnimationFrame(gameLoop);