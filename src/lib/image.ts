/**
 * Redimensionne et compresse une image (fichier) en data-URI JPEG, pour un
 * stockage léger (ex. photo de profil). Recadrage carré centré.
 */
export function downscaleImage(file: File, size = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image invalide'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas indisponible'))
        // Recadrage carré centré
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Redimensionne une photo d'annonce en conservant ses proportions (pas de
 * recadrage), avec un côté maximal `maxDim`, puis l'encode en JPEG.
 *
 * Indispensable pour l'upload : une photo de téléphone brute (plusieurs Mo)
 * dépasse la limite `post_max_size` du serveur (~8 Mo), la requête est rejetée
 * et l'annonce ne serait jamais enregistrée. Après compression, une image fait
 * généralement 150–400 Ko.
 */
export function downscaleListingImage(file: File, maxDim = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    // Les fichiers non-image (ex. HEIC non décodable) ou déjà en data-URI sont
    // laissés tels quels plutôt que de bloquer la publication.
    if (!file.type.startsWith('image/')) return reject(new Error('Fichier non image'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image invalide'))
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas indisponible'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
