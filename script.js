const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const photoGallery = document.getElementById('photo-gallery');
const polaroidContainer = document.getElementById('polaroid-container');
const polaroidGallery = document.getElementById('polaroid-gallery');
const takePhotoButton = document.getElementById('takePhoto');
const savePhotoButton = document.getElementById('savePhoto');
const retryPhotoButton = document.getElementById('retryPhoto');
const countdownDisplay = document.getElementById('countdown');
const filterSelect = document.getElementById('filterSelect'); // Ambil elemen filter

const MAX_PHOTOS = 3; // Maksimal jumlah foto yang diizinkan
let photoInterval;
let selectedFilter = ''; // Variabel untuk menyimpan filter yang dipilih

// Mengakses kamera
async function accessCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        // Jika kamera berhasil diakses, tampilkan elemen yang diperlukan
        enableCameraFeatures();
    } catch (err) {
        console.error("Gagal mengakses kamera: ", err);
        // Jika gagal mengakses kamera, tampilkan pesan kesalahan dan nonaktifkan fitur
        disableCameraFeatures();
    }
}

// Mengaktifkan fitur kamera
function enableCameraFeatures() {
    takePhotoButton.style.display = 'inline';
    savePhotoButton.style.display = 'none';
    retryPhotoButton.style.display = 'none';
    countdownDisplay.style.display = 'block';
    filterSelect.style.display = 'none'; // Sembunyikan filter saat awal
}

// Menonaktifkan fitur kamera
function disableCameraFeatures() {
    document.getElementById('photobooth-container').style.display = 'none'; // Menyembunyikan seluruh kontainer
    const errorMessage = document.getElementById('error-message');
    errorMessage.innerText = "Akses kamera diperlukan untuk menggunakan website ini. Silahkan coba lagi.";
    errorMessage.style.display = 'block'; // Menampilkan pesan kesalahan
}

// Menghitung mundur sebelum mengambil foto
function startCountdown() {
    let countdown = 3;
    countdownDisplay.textContent = countdown;

    // Sembunyikan tombol "Ambil Foto" setelah diklik
    takePhotoButton.style.display = 'none';

    const countdownInterval = setInterval(() => {
        countdown--;
        countdownDisplay.textContent = countdown;

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            takePhoto();
            countdownDisplay.textContent = '';
            photoInterval = setInterval(takePhoto, 3000);
        }
    }, 1000);
}

// Mengambil foto
function takePhoto() {
    if (photoGallery.children.length >= MAX_PHOTOS) {
        clearInterval(photoInterval);
        countdownDisplay.textContent = '';
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Menggambar gambar dari video tanpa membalikkan
    ctx.save(); // Simpan keadaan konteks saat ini
    ctx.scale(-1, 1); // Membalikkan gambar secara horizontal
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height); // Gambar video ke kanvas
    ctx.restore(); // Kembalikan keadaan konteks ke semula

    const photoURL = canvas.toDataURL('image/png');

    // Membuat elemen polaroid
    const polaroid = document.createElement('div');
    polaroid.className = 'polaroid';

    const img = document.createElement('img');
    img.src = photoURL;
    img.style.filter = selectedFilter; // Terapkan filter yang dipilih

    polaroid.appendChild(img);
    photoGallery.appendChild(polaroid);
    photoGallery.style.display = 'flex';

    // Jika sudah mencapai jumlah maksimum foto, sembunyikan tombol "Ambil Foto"
    if (photoGallery.children.length === MAX_PHOTOS) {
        showPolaroidOptions();
        takePhotoButton.style.display = 'none'; // Sembunyikan tombol "Ambil Foto"
    }

    updateButtons();
}

// Memperbarui tampilan tombol
function updateButtons() {
    const hasPhotos = photoGallery.children.length >= MAX_PHOTOS;
    savePhotoButton.style.display = hasPhotos ? 'inline' : 'none';
    retryPhotoButton.style.display = hasPhotos ? 'inline' : 'none';
    filterSelect.style.display = hasPhotos ? 'inline' : 'none';
}

// Event Listeners
takePhotoButton.addEventListener('click', () => {
    if (photoGallery.children.length < MAX_PHOTOS) {
        startCountdown();
    }
});

savePhotoButton.addEventListener('click', () => {
    // Membuat kanvas baru untuk menyimpan gabungan foto
    const combinedCanvas = document.createElement('canvas');
    const combinedCtx = combinedCanvas.getContext('2d');

    // Mengatur ukuran kanvas gabungan untuk orientasi vertikal
    const photoWidth = 240; // Lebar untuk foto vertikal
    const photoHeight = 220; // Tinggi untuk foto vertikal
    const borderBottomHeight = 10; // Tinggi tambahan untuk border bawah
    combinedCanvas.width = photoWidth; // Lebar kanvas
    combinedCanvas.height = (photoHeight + borderBottomHeight) * MAX_PHOTOS; // Tinggi untuk MAX_PHOTOS

    // Menggambar semua foto ke kanvas gabungan dengan bingkai
    Array.from(photoGallery.children).forEach((polaroid, index) => {
        const img = polaroid.querySelector('img');
        combinedCtx.fillStyle = 'white'; // Warna bingkai
        combinedCtx.fillRect(0, index * (photoHeight + borderBottomHeight), photoWidth, photoHeight + borderBottomHeight); // Gambar bingkai dengan border bawah yang lebih besar
        combinedCtx.drawImage(img, 10, index * (photoHeight + borderBottomHeight) + 10, photoWidth - 20, photoHeight - 20); // Gambar foto
        // Terapkan filter yang sama pada gambar di kanvas gabungan
        combinedCtx.filter = selectedFilter; // Terapkan filter
        combinedCtx.drawImage(img, 10, index * (photoHeight + borderBottomHeight) + 10, photoWidth - 20, photoHeight - 20); // Gambar foto dengan filter
        combinedCtx.filter = 'none'; // Reset filter untuk gambar berikutnya
    });

    // Menyimpan kanvas gabungan sebagai gambar
    const link = document.createElement('a');
    link.download = 'Apipp_Photobooth_Photo.png';
    link.href = combinedCanvas.toDataURL('image/png');
    link.click();
});

retryPhotoButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    photoGallery.innerHTML = '';
    polaroidContainer.style.display = 'none';
    photoGallery.style.display = 'none';
    updateButtons();
    
    // Tampilkan kembali tombol "Ambil Foto"
    takePhotoButton.style.display = 'inline'; // Tampilkan kembali tombol "Ambil Foto"
    filterSelect.style.display = 'none'; // Sembunyikan filter saat mengulang
});

// Menampilkan opsi polaroid
function showPolaroidOptions() {
    polaroidContainer.style.display = 'block';
}

// Event listener untuk mengubah filter
filterSelect.addEventListener('change', function() {
    selectedFilter = filterSelect.value; // Simpan filter yang dipilih
    const polaroidImages = photoGallery.querySelectorAll('img');
    polaroidImages.forEach(img => {
        img.style.filter = selectedFilter; // Terapkan filter pada semua gambar di galeri
    });
});

// Inisialisasi
accessCamera();