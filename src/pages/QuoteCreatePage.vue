<script setup lang="ts">
import { useRouter } from 'vue-router'

import QuoteForm from '@/components/quotes/QuoteForm.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { ROUTE_NAMES } from '@/constants'
import type { Quote } from '@/types'

const router = useRouter()

async function onSuccess(quote: Quote): Promise<void> {
  await router.push({
    name: ROUTE_NAMES.quoteDetail,
    params: { id: quote.id },
    query: { created: '1' }
  })
}
</script>

<template>
  <div>
    <PageHeader :title="$t('quotes.newQuote')" :subtitle="$t('quotes.createSubtitle')" />
    <QuoteForm @success="onSuccess" />
  </div>
</template>
