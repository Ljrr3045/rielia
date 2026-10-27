import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { assertRuntimeReady, databasePool } from './database.js';

@Injectable()
export class RuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly pool = process.env['LOCAL_RUNTIME_ENABLED'] === 'true' ? databasePool() : null;

  async onModuleInit(): Promise<void> {
    if (this.pool) await assertRuntimeReady(this.pool);
  }

  async ready(): Promise<boolean> {
    if (!this.pool) return false;
    try { await assertRuntimeReady(this.pool); return true; }
    catch { return false; }
  }

  async onModuleDestroy(): Promise<void> { await this.pool?.end(); }
}
