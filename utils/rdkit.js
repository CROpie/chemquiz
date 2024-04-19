let RDKit

export async function initRDKit() {
  RDKit = await initRDKitModule()
}

export function getRDKit() {
  return RDKit
}
