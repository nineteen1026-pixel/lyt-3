<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Download, Upload, AlertTriangle, CheckCircle2, XCircle,
  FileJson, Shield, Info, ChevronDown, ChevronRight, X, ShieldAlert,
} from 'lucide-vue-next'
import { useDataRecovery } from '@/composables/useDataRecovery'
import { useBabyCare } from '@/composables/useBabyCare'

const router = useRouter()
const {
  importPreview, isExporting, isImporting, hasConflicts, hasCriticalConflicts,
  localDataSummary, totalLocalRecords, exportBackup, previewImport, clearPreview, applyImport,
} = useDataRecovery()
const { canExportData } = useBabyCare()

const fileInput = ref<HTMLInputElement | null>(null)
const showConfirmModal = ref(false)
const confirmMode = ref<'overwrite' | 'merge'>('merge')
const expandedConflict = ref<string | null>(null)

function handleExport() {
  exportBackup()
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await previewImport(file)
  input.value = ''
}

function handleCancelImport() {
  clearPreview()
  showConfirmModal.value = false
}

function requestApply(mode: 'overwrite' | 'merge') {
  confirmMode.value = mode
  showConfirmModal.value = true
}

function handleConfirmApply() {
  const success = applyImport(confirmMode.value)
  showConfirmModal.value = false
  if (success) {
    clearPreview()
  }
}

function toggleConflict(key: string) {
  expandedConflict.value = expandedConflict.value === key ? null : key
}

function getConflictIcon(type: string) {
  switch (type) {
    case 'both_have_data': return ShieldAlert
    case 'local_has_more': return AlertTriangle
    case 'import_has_more': return Info
    case 'import_only': return CheckCircle2
    default: return Info
  }
}

function getConflictColor(type: string) {
  switch (type) {
    case 'both_has_data': return 'text-amber-500'
    case 'local_has_more': return 'text-orange-500'
    case 'import_has_more': return 'text-blue-500'
    case 'import_only': return 'text-mint-500'
    default: return 'text-warm-300'
  }
}

function getConflictBg(type: string) {
  switch (type) {
    case 'both_have_data': return 'bg-amber-50 dark:bg-amber-500/10'
    case 'local_has_more': return 'bg-orange-50 dark:bg-orange-500/10'
    case 'import_has_more': return 'bg-blue-50 dark:bg-blue-500/10'
    case 'import_only': return 'bg-mint-50 dark:bg-mint-500/10'
    default: return 'bg-cream-50 dark:bg-warm-500/10'
  }
}

function getConflictDesc(type: string) {
  switch (type) {
    case 'both_have_data': return '本地与备份均有数据，可能存在冲突'
    case 'local_has_more': return '本地数据多于备份数据，覆盖将丢失本地数据'
    case 'import_has_more': return '备份数据多于本地，导入可补充缺失记录'
    case 'import_only': return '本地无此类数据，导入将添加新数据'
    default: return ''
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 pt-4 pb-24">
    <header class="flex items-center gap-3 mb-4">
      <button @click="router.push('/settings')" class="w-9 h-9 rounded-xl bg-white dark:bg-[#2a1f1a] flex items-center justify-center shadow-sm">
        <ArrowLeft :size="18" class="text-warm-400 dark:text-warm-100" />
      </button>
      <h1 class="text-lg font-extrabold text-warm-500 dark:text-cream-100 font-display flex items-center gap-2">
        <Shield :size="20" class="text-peach-400" />
        数据恢复中心
      </h1>
    </header>

    <section class="mb-5">
      <div class="bg-gradient-to-br from-peach-50 to-mint-50 dark:from-peach-500/10 dark:to-mint-500/10 rounded-2xl p-4">
        <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">本地数据概览</p>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl font-extrabold text-peach-500 dark:text-peach-400 font-display">{{ totalLocalRecords }}</span>
          <span class="text-xs text-warm-300 dark:text-warm-200">条记录</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="item in localDataSummary"
            :key="item.key"
            class="text-[10px] px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-warm-400 dark:text-warm-100 font-semibold"
          >
            {{ item.label }} {{ item.count }}
          </span>
        </div>
      </div>
    </section>

    <section class="mb-5">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Download :size="14" /> 导出备份
      </h2>
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm p-4">
        <p class="text-xs text-warm-300 dark:text-warm-200 mb-3">将所有数据导出为 JSON 文件，可用于数据迁移或备份恢复。</p>
        <button
          v-if="canExportData"
          @click="handleExport"
          :disabled="isExporting"
          class="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Download :size="16" />
          {{ isExporting ? '导出中...' : '导出备份文件' }}
        </button>
        <div v-else class="flex items-center gap-2 text-xs text-warm-300 dark:text-warm-200 bg-cream-50 dark:bg-warm-500/10 rounded-xl p-3">
          <XCircle :size="14" class="shrink-0" />
          <span>当前角色无导出权限</span>
        </div>
      </div>
    </section>

    <section class="mb-5">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Upload :size="14" /> 导入恢复
      </h2>
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm p-4">
        <template v-if="!importPreview">
          <p class="text-xs text-warm-300 dark:text-warm-200 mb-3">选择之前导出的备份文件，预览内容后再决定是否恢复。</p>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileChange"
          />
          <button
            @click="triggerFileInput"
            class="w-full py-2.5 rounded-xl text-sm font-bold text-peach-500 bg-peach-50 dark:bg-peach-500/10 hover:bg-peach-100 dark:hover:bg-peach-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border-2 border-dashed border-peach-200 dark:border-peach-500/30"
          >
            <FileJson :size="16" />
            选择备份文件
          </button>
        </template>

        <template v-else>
          <div v-if="!importPreview.isValid" class="mb-3">
            <div class="flex items-start gap-2 bg-red-50 dark:bg-red-500/10 rounded-xl p-3">
              <XCircle :size="16" class="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p class="text-xs font-bold text-red-500 mb-0.5">文件解析失败</p>
                <p class="text-[10px] text-red-400">{{ importPreview.error }}</p>
              </div>
            </div>
            <button
              @click="clearPreview"
              class="mt-3 w-full py-2 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10"
            >
              重新选择
            </button>
          </div>

          <div v-else>
            <div class="flex items-start gap-2 bg-mint-50 dark:bg-mint-500/10 rounded-xl p-3 mb-3">
              <CheckCircle2 :size="16" class="text-mint-500 shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-mint-600 dark:text-mint-400 mb-0.5">文件解析成功</p>
                <p class="text-[10px] text-mint-500 dark:text-mint-300">{{ importPreview.fileName }} · {{ importPreview.fileSize }}</p>
                <p class="text-[10px] text-warm-300 dark:text-warm-200">导出时间：{{ formatDate(importPreview.exportedAt) }} · 版本 {{ importPreview.version }}</p>
              </div>
            </div>

            <div class="mb-3">
              <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-2">备份内容预览</p>
              <div class="space-y-1">
                <div
                  v-for="item in importPreview.summary"
                  :key="item.key"
                  class="flex items-center justify-between px-3 py-2 rounded-lg bg-cream-50 dark:bg-warm-500/10"
                >
                  <span class="text-xs text-warm-400 dark:text-warm-100">{{ item.label }}</span>
                  <span class="text-xs font-bold text-peach-500">{{ item.count }} 条</span>
                </div>
              </div>
            </div>

            <div v-if="hasConflicts" class="mb-3">
              <div class="flex items-center gap-1.5 mb-2">
                <AlertTriangle :size="14" :class="hasCriticalConflicts ? 'text-amber-500' : 'text-blue-500'" />
                <p class="text-xs font-bold" :class="hasCriticalConflicts ? 'text-amber-500' : 'text-blue-500'">
                  {{ hasCriticalConflicts ? '发现数据冲突' : '数据差异提示' }}
                </p>
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="conflict in importPreview.conflicts"
                  :key="conflict.key"
                  class="rounded-xl overflow-hidden"
                  :class="getConflictBg(conflict.conflictType)"
                >
                  <button
                    @click="toggleConflict(conflict.key)"
                    class="w-full flex items-center justify-between px-3 py-2.5 text-left"
                  >
                    <div class="flex items-center gap-2">
                      <component
                        :is="getConflictIcon(conflict.conflictType)"
                        :size="14"
                        :class="getConflictColor(conflict.conflictType)"
                      />
                      <span class="text-xs font-semibold text-warm-500 dark:text-cream-100">{{ conflict.label }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] text-warm-300 dark:text-warm-200">
                        本地 {{ conflict.localCount }} / 备份 {{ conflict.importCount }}
                      </span>
                      <component
                        :is="expandedConflict === conflict.key ? ChevronDown : ChevronRight"
                        :size="12"
                        class="text-warm-300 dark:text-warm-200"
                      />
                    </div>
                  </button>
                  <div v-if="expandedConflict === conflict.key" class="px-3 pb-2.5">
                    <p class="text-[10px] text-warm-400 dark:text-warm-100">{{ getConflictDesc(conflict.conflictType) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-2 mt-4">
              <button
                @click="handleCancelImport"
                class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10"
              >
                取消
              </button>
              <button
                @click="requestApply('merge')"
                class="flex-1 py-2.5 rounded-xl text-sm font-bold text-mint-500 bg-mint-50 dark:bg-mint-500/10 hover:bg-mint-100 dark:hover:bg-mint-500/20 transition-all active:scale-[0.98]"
              >
                合并导入
              </button>
              <button
                @click="requestApply('overwrite')"
                class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-peach-400 hover:bg-peach-500 shadow-md shadow-peach-200 dark:shadow-peach-500/20 transition-all active:scale-[0.98]"
              >
                覆盖导入
              </button>
            </div>
          </div>
        </template>
      </div>
    </section>

    <section class="mb-5">
      <h2 class="text-sm font-bold text-warm-400 dark:text-warm-100 mb-3 flex items-center gap-1.5">
        <Info :size="14" /> 使用说明
      </h2>
      <div class="bg-white dark:bg-[#2a1f1a] rounded-2xl shadow-sm p-4 space-y-3">
        <div>
          <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1">导出备份</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">将所有本地数据（喂养、睡眠、换尿布、健康、药品等）打包为 JSON 文件保存到本地。</p>
        </div>
        <div>
          <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1">合并导入</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">将备份数据与本地数据合并，已有的记录不会重复导入，缺失的记录会被补充。适合补充丢失的数据。</p>
        </div>
        <div>
          <p class="text-xs font-bold text-warm-400 dark:text-warm-100 mb-1">覆盖导入</p>
          <p class="text-[10px] text-warm-300 dark:text-warm-200">用备份数据完全替换本地数据。本地所有数据将被覆盖，操作前请确认已导出当前数据的备份。</p>
        </div>
        <div class="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-2.5">
          <p class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">⚠ 重要提示：覆盖导入不可撤销，请务必先导出当前数据再执行覆盖操作。</p>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="showConfirmModal = false"></div>
        <div class="relative bg-white dark:bg-[#2a1f1a] rounded-2xl p-5 w-full max-w-sm shadow-2xl">
          <button
            @click="showConfirmModal = false"
            class="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-warm-300 dark:text-warm-200 hover:bg-cream-100 dark:hover:bg-warm-500/10"
          >
            <X :size="16" />
          </button>

          <div v-if="confirmMode === 'overwrite'" class="text-center mb-4">
            <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle :size="24" class="text-red-500" />
            </div>
            <h3 class="text-base font-extrabold text-warm-500 dark:text-cream-100 mb-1">确认覆盖本地数据？</h3>
            <p class="text-xs text-warm-300 dark:text-warm-200">此操作将用备份数据完全替换本地所有数据，且不可撤销。</p>
          </div>

          <div v-else class="text-center mb-4">
            <div class="w-12 h-12 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center mx-auto mb-3">
              <Upload :size="24" class="text-mint-500" />
            </div>
            <h3 class="text-base font-extrabold text-warm-500 dark:text-cream-100 mb-1">确认合并导入？</h3>
            <p class="text-xs text-warm-300 dark:text-warm-200">将备份中的新记录合并到本地数据中，已有记录保持不变。</p>
          </div>

          <div v-if="hasCriticalConflicts && confirmMode === 'overwrite'" class="bg-red-50 dark:bg-red-500/10 rounded-xl p-3 mb-4">
            <p class="text-[10px] text-red-500 font-semibold mb-1">检测到数据冲突：</p>
            <div
              v-for="c in importPreview?.conflicts.filter(c => c.conflictType === 'both_have_data' || c.conflictType === 'local_has_more')"
              :key="c.key"
              class="flex items-center justify-between text-[10px] py-0.5"
            >
              <span class="text-red-400">{{ c.label }}</span>
              <span class="text-red-400">本地 {{ c.localCount }} → 备份 {{ c.importCount }}</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="showConfirmModal = false"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold text-warm-300 dark:text-warm-200 bg-cream-100 dark:bg-warm-500/10"
            >
              取消
            </button>
            <button
              v-if="confirmMode === 'overwrite'"
              @click="handleConfirmApply"
              :disabled="isImporting"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {{ isImporting ? '恢复中...' : '确认覆盖' }}
            </button>
            <button
              v-else
              @click="handleConfirmApply"
              :disabled="isImporting"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-mint-500 hover:bg-mint-600 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {{ isImporting ? '合并中...' : '确认合并' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
