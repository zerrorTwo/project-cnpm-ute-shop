import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';

import { Bill } from '../entities/bill.entity';

interface OrderDocument {
  id: number;
  billCode: string;
  orderId: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  status?: string;
  customerId?: number | null;
  createdAt?: string | null;
  itemNames: string[];
}

@Injectable()
export class OrderSearchService {
  private readonly logger = new Logger(OrderSearchService.name);
  private readonly indexName: string;
  private client: MeiliSearch | null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>(
      'MEILI_HOST',
      'http://localhost:7700',
    );
    const apiKey =
      this.configService.get<string>('MEILI_MASTER_KEY') || 'masterKey';
    this.configService.get<string>('MEILI_API_KEY') ||
      this.configService.get<string>('MEILI_SEARCH_KEY') ||
      this.configService.get<string>('MEILI_ADMIN_KEY');

    this.indexName = this.configService.get<string>(
      'MEILI_BILL_INDEX',
      'bills',
    );

    if (!host) {
      this.logger.warn(
        'Meilisearch host is not configured; order search is disabled.',
      );
      this.client = null;
      return;
    }

    this.client = new MeiliSearch({ host, apiKey });
    this.configureIndex().catch((error) =>
      this.logger.warn(
        `Failed to configure Meilisearch index: ${error?.message}`,
      ),
    );
  }

  private async configureIndex() {
    const index = await this.getOrCreateIndex();
    if (!index) return;

    try {
      const rankingRulesEnv = this.configService.get<string>(
        'MEILI_RANKING_RULES',
      );
      const stopWordsEnv = this.configService.get<string>('MEILI_STOP_WORDS');
      const synonymsJson = this.configService.get<string>(
        'MEILI_SYNONYMS_JSON',
      );
      const typoToleranceJson = this.configService.get<string>(
        'MEILI_TYPO_TOLERANCE_JSON',
      );

      const rankingRules = rankingRulesEnv
        ? rankingRulesEnv
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean)
        : undefined;
      const stopWords = stopWordsEnv
        ? stopWordsEnv
            .split(',')
            .map((w) => w.trim())
            .filter(Boolean)
        : undefined;

      let synonyms: Record<string, string[]> | undefined;
      if (synonymsJson) {
        try {
          const parsed = JSON.parse(synonymsJson);
          if (parsed && typeof parsed === 'object') {
            synonyms = parsed as Record<string, string[]>;
          }
        } catch (e) {
          this.logger.warn('Invalid MEILI_SYNONYMS_JSON; skipping synonyms.');
        }
      }

      let typoTolerance: any | undefined;
      if (typoToleranceJson) {
        try {
          const parsed = JSON.parse(typoToleranceJson);
          if (parsed && typeof parsed === 'object') {
            typoTolerance = parsed;
          }
        } catch (e) {
          this.logger.warn(
            'Invalid MEILI_TYPO_TOLERANCE_JSON; skipping typoTolerance.',
          );
        }
      }

      await index.updateSettings({
        searchableAttributes: [
          'receiverName',
          'receiverPhone',
          'shippingAddress',
          'billCode',
          'orderId',
          'itemNames',
        ],
        filterableAttributes: ['status', 'customerId'],
        sortableAttributes: ['createdAt'],
        ...(rankingRules ? { rankingRules } : {}),
        ...(stopWords ? { stopWords } : {}),
        ...(synonyms ? { synonyms } : {}),
        ...(typoTolerance ? { typoTolerance } : {}),
      });
    } catch (error) {
      this.logger.warn(`Cannot update Meilisearch settings: ${error?.message}`);
    }
  }

  private async getOrCreateIndex(): Promise<Index<OrderDocument> | null> {
    if (!this.client) return null;

    try {
      const existingIndex = await this.client.getIndex(this.indexName);
      return this.client.index<OrderDocument>(existingIndex.uid);
    } catch (error) {
      this.logger.log(`Creating Meilisearch index '${this.indexName}'.`);
      try {
        await this.client.createIndex(this.indexName, { primaryKey: 'id' });
        return this.client.index<OrderDocument>(this.indexName);
      } catch (createError) {
        this.logger.error(
          `Failed to create Meilisearch index: ${createError?.message}`,
        );
        return null;
      }
    }
  }

  private toDocument(bill: Bill): OrderDocument | null {
    if (!bill) return null;

    const itemNames =
      bill.items?.map((item) => item?.product?.productName).filter(Boolean) ||
      [];

    return {
      id: bill.id,
      billCode: bill.billCode ? String(bill.billCode) : '',
      orderId: bill.orderId ? String(bill.orderId) : '',
      receiverName: bill.receiverName || '',
      receiverPhone: bill.receiverPhone || '',
      shippingAddress: bill.shippingAddress || '',
      status: bill.status,
      customerId: bill.customer?.id ?? null,
      createdAt: bill.createdAt ? new Date(bill.createdAt).toISOString() : null,
      itemNames,
    };
  }

  async indexBills(bills: Bill | Bill[]): Promise<void> {
    if (!this.client) return;

    const documents = (Array.isArray(bills) ? bills : [bills])
      .map((bill) => this.toDocument(bill))
      .filter((doc): doc is OrderDocument => Boolean(doc));

    if (!documents.length) return;

    const index = await this.getOrCreateIndex();
    if (!index) return;

    try {
      await index.addDocuments(documents);
    } catch (error) {
      this.logger.warn(
        `Failed to index bills in Meilisearch: ${error?.message}`,
      );
    }
  }

  async deleteBills(ids: number[]): Promise<void> {
    if (!ids.length) return;
    const index = await this.getOrCreateIndex();
    if (!index) return;

    try {
      await index.deleteDocuments(ids);
    } catch (error) {
      this.logger.warn(
        `Failed to delete bills from Meilisearch: ${error?.message}`,
      );
    }
  }

  async searchBills(
    query: string,
    page: number,
    limit: number,
    options?: { status?: string; customerId?: number },
  ): Promise<{ ids: number[]; total: number } | null> {
    const index = await this.getOrCreateIndex();
    if (!index) return null;

    const filters: string[] = [];
    if (options?.status) filters.push(`status = "${options.status}"`);
    if (options?.customerId !== undefined)
      filters.push(`customerId = ${options.customerId}`);

    try {
      const result = await index.search<OrderDocument>(query || '', {
        limit,
        offset: (page - 1) * limit,
        filter: filters.length ? filters.join(' AND ') : undefined,
      });

      return {
        ids: result.hits
          .map((hit) => Number(hit.id))
          .filter((id) => !Number.isNaN(id)),
        total: result.estimatedTotalHits ?? result.hits.length,
      };
    } catch (error) {
      this.logger.warn(
        `Meilisearch query failed, falling back to DB search: ${error?.message}`,
      );
      return null;
    }
  }
}
