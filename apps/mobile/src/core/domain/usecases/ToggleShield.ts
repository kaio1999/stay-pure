import type { ShieldStatus } from '../entities/models';
import type { ShieldGateway } from '../repositories/contracts';

export class ToggleShield {
  constructor(private readonly gateway: ShieldGateway) {}

  async execute(enabled: boolean, strictMode: boolean): Promise<ShieldStatus> {
    if (enabled) {
      await this.gateway.enable(strictMode);
    } else {
      await this.gateway.disable();
    }
    await new Promise((resolve) => setTimeout(resolve, enabled ? 500 : 250));
    return this.gateway.status();
  }
}
