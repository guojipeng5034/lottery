/**
 * 图片缓存工具
 * 用于预加载和缓存用户头像图片到内存中
 */

// 图片缓存Map：key为原始URL，value为blob URL
const imageCache = new Map<string, string>()

// 正在加载的图片Promise：key为原始URL，value为Promise
const loadingPromises = new Map<string, Promise<string>>()

/**
 * 加载单张图片到内存
 * @param url 图片URL
 * @returns Promise<string> 返回blob URL
 */
function loadImage(url: string): Promise<string> {
    // 如果已经缓存，直接返回
    if (imageCache.has(url)) {
        return Promise.resolve(imageCache.get(url)!)
    }

    // 如果正在加载，返回现有的Promise
    if (loadingPromises.has(url)) {
        return loadingPromises.get(url)!
    }

    // 创建新的加载Promise
    const promise = new Promise<string>((resolve, reject) => {
        // 空URL或无效URL直接返回原URL
        if (!url || url.trim() === '' || url === 'undefined' || url === 'null') {
            resolve(url)
            return
        }

        // 如果是blob URL或data URL，直接使用
        if (url.startsWith('blob:') || url.startsWith('data:')) {
            imageCache.set(url, url)
            resolve(url)
            return
        }

        // 使用fetch加载图片
        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load image: ${response.statusText}`)
                }
                return response.blob()
            })
            .then((blob) => {
                // 创建blob URL
                const blobUrl = URL.createObjectURL(blob)
                // 缓存blob URL
                imageCache.set(url, blobUrl)
                resolve(blobUrl)
            })
            .catch((error) => {
                console.warn(`Failed to cache image ${url}:`, error)
                // 加载失败时，返回原URL
                resolve(url)
            })
            .finally(() => {
                // 加载完成后，从loadingPromises中移除
                loadingPromises.delete(url)
            })
    })

    // 保存加载Promise
    loadingPromises.set(url, promise)
    return promise
}

/**
 * 批量预加载图片
 * @param urls 图片URL数组
 * @param onProgress 进度回调 (loaded: number, total: number) => void
 * @returns Promise<void>
 */
export function preloadImages(urls: string[], onProgress?: (loaded: number, total: number) => void): Promise<void> {
    // 去重并过滤空URL
    const uniqueUrls = Array.from(new Set(urls.filter(url => url && url.trim() !== '' && url !== 'undefined' && url !== 'null')))
    
    if (uniqueUrls.length === 0) {
        return Promise.resolve()
    }

    let loadedCount = 0
    const total = uniqueUrls.length

    // 并发加载所有图片（限制并发数，避免浏览器限制）
    const concurrency = 10 // 每次最多10个并发请求
    const promises: Promise<void>[] = []

    for (let i = 0; i < uniqueUrls.length; i += concurrency) {
        const batch = uniqueUrls.slice(i, i + concurrency)
        const batchPromises = batch.map((url) => {
            return loadImage(url)
                .then(() => {
                    loadedCount++
                    if (onProgress) {
                        onProgress(loadedCount, total)
                    }
                })
                .catch((error) => {
                    console.warn(`Failed to preload image ${url}:`, error)
                    loadedCount++
                    if (onProgress) {
                        onProgress(loadedCount, total)
                    }
                })
        })
        promises.push(...batchPromises)
    }

    return Promise.all(promises).then(() => {
        console.log(`图片预加载完成: ${loadedCount}/${total}`)
    })
}

/**
 * 获取缓存的图片URL
 * @param url 原始图片URL
 * @returns string 缓存的blob URL或原URL
 */
export function getCachedImageUrl(url: string): string {
    // 空URL或无效URL直接返回
    if (!url || url.trim() === '' || url === 'undefined' || url === 'null') {
        return url
    }

    // 如果是blob URL或data URL，直接返回
    if (url.startsWith('blob:') || url.startsWith('data:')) {
        return url
    }

    // 从缓存中获取
    return imageCache.get(url) ?? url
}

/**
 * 清除图片缓存
 * @param url 可选，指定要清除的图片URL，不传则清除所有缓存
 */
export function clearImageCache(url?: string): void {
    if (url) {
        const blobUrl = imageCache.get(url)
        if (blobUrl && blobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(blobUrl)
        }
        imageCache.delete(url)
        loadingPromises.delete(url)
    }
    else {
        // 清除所有缓存
        imageCache.forEach((blobUrl) => {
            if (blobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(blobUrl)
            }
        })
        imageCache.clear()
        loadingPromises.clear()
    }
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
    return {
        cachedCount: imageCache.size,
        loadingCount: loadingPromises.size,
    }
}
