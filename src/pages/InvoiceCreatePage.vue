<script setup lang="ts">
import { useRouter } from 'vue-router'

import InvoiceForm from '@/components/invoices/InvoiceForm.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { ROUTE_NAMES } from '@/constants'
import type { Invoice } from '@/types'

const router = useRouter()

async function onSuccess(invoice: Invoice): Promise<void> {
  await router.push({
    name: ROUTE_NAMES.invoiceDetail,
    params: { id: invoice.id },
    query: { created: '1' }
  })
}
</script>

<template>
  <div>
    <PageHeader :title="$t('invoices.newInvoice')" :subtitle="$t('invoices.form.createSubtitle')" />
    <InvoiceForm @success="onSuccess" />
  </div>
</template>
