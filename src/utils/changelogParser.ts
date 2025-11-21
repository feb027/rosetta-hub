export interface ChangeItem {
    type: 'added' | 'changed' | 'fixed';
    content: string;
    details?: string[];
}

export interface Release {
    version: string;
    date: string;
    changes: ChangeItem[];
}

export function parseChangelog(markdown: string): Release[] {
    const releases: Release[] = [];
    const lines = markdown.split('\n');

    let currentRelease: Release | null = null;
    let currentType: ChangeItem['type'] | null = null;
    let currentChange: ChangeItem | null = null;

    const versionRegex = /^## \[(.*?)\] - (\d{4}-\d{2}-\d{2})/;
    const typeRegex = /^### (Added|Changed|Fixed)/;
    const itemRegex = /^- (.*)/;
    const detailRegex = /^  - (.*)/;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Match Version
        const versionMatch = line.match(versionRegex);
        if (versionMatch) {
            if (currentRelease) {
                if (currentChange) {
                    // Push last change of previous release if exists (though usually types separate them)
                }
                releases.push(currentRelease);
            }
            currentRelease = {
                version: versionMatch[1],
                date: versionMatch[2],
                changes: []
            };
            currentType = null;
            currentChange = null;
            continue;
        }

        if (!currentRelease) continue;

        // Match Type
        const typeMatch = line.match(typeRegex);
        if (typeMatch) {
            currentType = typeMatch[1].toLowerCase() as ChangeItem['type'];
            continue;
        }

        if (!currentType) continue;

        // Match Item
        const itemMatch = line.match(itemRegex);
        if (itemMatch) {
            // Clean up markdown bolding from content if present, e.g. "**New Problem**: Title" -> "New Problem: Title"
            let content = itemMatch[1].replace(/\*\*(.*?)\*\*/g, '$1');

            currentChange = {
                type: currentType,
                content: content,
                details: []
            };
            currentRelease.changes.push(currentChange);
            continue;
        }

        // Match Detail
        const detailMatch = line.match(detailRegex);
        if (detailMatch && currentChange) {
            // Clean up code ticks
            const detail = detailMatch[1].replace(/`/g, '');
            currentChange.details = currentChange.details || [];
            currentChange.details.push(detail);
        }
    }

    if (currentRelease) {
        releases.push(currentRelease);
    }

    return releases;
}
