// Common data transformations used across dashboard pages

/**
 * Get username with fallback to "Sistem"
 * Prioritizes displayName, then username, then "Sistem"
 */
export function getUsername(
	user:
		| { username?: string | null; displayName?: string | null }
		| null
		| undefined,
): string {
	return user?.displayName ?? user?.username ?? "Sistem";
}

/**
 * Resolve active lease from an entity with leases array
 * Returns the active lease if found, otherwise the first lease
 */
export function getActiveLease<L extends { isActive?: boolean }>(
	entity: { leases?: L[] } | null | undefined,
): L | undefined {
	return entity?.leases?.find((l) => l.isActive) ?? entity?.leases?.[0];
}

/**
 * Get tenant display information (name + room number)
 */
export function getTenantDisplayInfo(entity: {
	tenant?: {
		fullName?: string | null;
		leases?: Array<{
			isActive?: boolean;
			room?: { roomNumber?: string | null };
		}>;
	} | null;
}): { tenantName: string; roomNumber: string } {
	const activeLease = getActiveLease(entity.tenant);
	return {
		tenantName: entity.tenant?.fullName ?? "-",
		roomNumber: activeLease?.room?.roomNumber ?? "-",
	};
}

/**
 * Format invoice number as INV-XXXXXX
 */
export function formatInvoiceNumber(id: number): string {
	return `INV-${id.toString().padStart(6, "0")}`;
}

/**
 * Format currency in Indonesian Rupiah format
 */
export function formatCurrency(amount: number): string {
	return `Rp ${amount.toLocaleString("id-ID")}`;
}

/**
 * Generic status label resolver
 */
export function formatStatusLabel<T extends string>(
	status: T,
	labelMap: Record<T, string>,
): string {
	return labelMap[status] ?? status;
}
