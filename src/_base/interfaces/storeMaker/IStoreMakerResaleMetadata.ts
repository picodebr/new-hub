export const storeResaleTargetBuyers = <const>[`teacher`, `groups`];
export type StoreResaleTargetBuyerType = (typeof storeResaleTargetBuyers)[number];

export interface IStoreMakerResaleMetadata {
  target_buyer: StoreResaleTargetBuyerType;
}
