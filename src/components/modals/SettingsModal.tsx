import React, { useState, useEffect, useRef } from 'react';
import { CURRENT_SAVE_VERSION } from '../../services/gameReducer'; // Imported from gameReducer as identified

const styles = {
    modalOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#F0F0F0',
        padding: '20px',
        borderRadius: '5px',
        maxWidth: '800px',
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto' as const,
        border: '4px solid #808080',
        boxShadow: '10px 10px 0px #000000',
        position: 'relative' as const,
        color: '#000000',
    },
    modalCloseButton: {
        position: 'absolute' as const,
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '1.2rem',
        cursor: 'pointer',
        color: '#808080',
    },
    title: {
        fontFamily: "'Press Start 2P', cursive",
        textTransform: 'uppercase' as const,
        letterSpacing: '2px',
        color: '#808080',
        fontSize: '1rem',
        textAlign: 'center' as const,
        marginBottom: '20px',
        borderBottom: '4px solid #808080',
        paddingBottom: '10px',
    },
    slotContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        border: '2px solid #808080',
        marginBottom: '10px',
        backgroundColor: '#E0E0E0',
    },
    slotInfo: {
        flex: 1,
    },
    slotActions: {
        display: 'flex',
        gap: '5px',
    },
    smallButton: {
        padding: '2px 8px',
        fontSize: '0.65rem',
        cursor: 'pointer',
        fontFamily: "'Press Start 2P', cursive",
        backgroundColor: '#C0C0C0',
        border: '2px solid #808080',
        boxShadow: '2px 2px 0px #000000',
        color: 'black',
        textTransform: 'uppercase' as const,
    },
};

const SettingsModal = ({
    isOpen,
    onClose,
    onSave,
    onLoad,
    onDelete,
    onExport,
    onImport,
}: {
    isOpen: boolean,
    onClose: () => void,
    onSave: (slot: number) => void,
    onLoad: (slot: number) => void,
    onDelete: (slot: number) => void,
    onExport: () => void,
    onImport: (file: File) => void,
}) => {
    if (!isOpen) return null;

    const [slotsMeta, setSlotsMeta] = useState<(any)[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const metas = [1, 2, 3].map(slot => {
            const metaJSON = localStorage.getItem(`sweetSixteenMeta_v${CURRENT_SAVE_VERSION}_${slot}`);
            return metaJSON ? { slot, ...JSON.parse(metaJSON) } : { slot, empty: true };
        });
        setSlotsMeta(metas);
    }, [isOpen]);

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <button onClick={onClose} style={styles.modalCloseButton}>X</button>
                <h2 style={{ ...styles.title, fontSize: '1.5rem', textShadow: '2px 2px 0px #808080', color: 'black' }}>Settings</h2>
                {slotsMeta.map(meta => (
                    <div key={meta.slot} style={styles.slotContainer}>
                        <div style={styles.slotInfo}>
                            <strong>Slot {meta.slot}:</strong>
                            <span style={{ marginLeft: '10px', fontSize: '0.6rem' }}>
                                {meta.empty ? <em>- Empty -</em> : `${meta.teamName} - ${2024 + meta.season}-${(2025 + meta.season) % 100} G${meta.game} (${meta.timestamp})`}
                            </span>
                        </div>
                        <div style={styles.slotActions}>
                            <button style={styles.smallButton} onClick={() => onSave(meta.slot)}>Save</button>
                            <button style={styles.smallButton} onClick={() => onLoad(meta.slot)} disabled={meta.empty}>Load</button>
                            <button style={{...styles.smallButton, backgroundColor: '#E0A0A0'}} onClick={() => onDelete(meta.slot)} disabled={meta.empty}>Delete</button>
                        </div>
                    </div>
                ))}
                <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ccc' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Manual Save Management</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button style={styles.smallButton} onClick={onExport}>Download Current Save</button>
                        <label style={{ fontSize: '0.7rem' }}>
                            Load From File:
                            <input
                                type="file"
                                accept="application/json"
                                ref={fileInputRef}
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        onImport(file);
                                        e.target.value = '';
                                    }
                                }}
                                style={{ display: 'block', marginTop: '5px' }}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
