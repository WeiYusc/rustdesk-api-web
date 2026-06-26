import { defineStore } from 'pinia'
import { ref } from 'vue'

interface TagItem {
  name: string
  path: string
  title: string
}

export const useTagsStore = defineStore('tags', () => {
  const tags = ref<TagItem[]>([])
  const cachedViews = ref<string[]>([])

  function addTag(tag: TagItem): void {
    if (tags.value.some((t) => t.path === tag.path)) return
    tags.value.push(tag)
    if (!cachedViews.value.includes(tag.name)) {
      cachedViews.value.push(tag.name)
    }
  }

  function removeTag(path: string): void {
    const idx = tags.value.findIndex((t) => t.path === path)
    if (idx === -1) return
    const removed = tags.value[idx]
    tags.value.splice(idx, 1)
    const stillUsed = tags.value.some((t) => t.name === removed.name)
    if (!stillUsed) {
      cachedViews.value = cachedViews.value.filter((n) => n !== removed.name)
    }
  }

  function clearTags(): void {
    tags.value = []
    cachedViews.value = []
  }

  return { tags, cachedViews, addTag, removeTag, clearTags }
})
