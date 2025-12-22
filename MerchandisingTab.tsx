import React, { useState, useEffect } from 'react';
import { GameState, Team, GameAction, TeamColors, MerchStrategy } from './types';

interface MerchandisingTabProps {
    state: GameState;
    userTeam: Team;
    dispatch: React.Dispatch<GameAction>;
    colors: TeamColors;
}

const MerchandisingTab: React.FC<MerchandisingTabProps> = ({ state, userTeam, dispatch, colors }) => {
    // Defensive check
    const merchandising = userTeam.merchandising || {
        inventoryStrategy: 'JustInTime',
        jerseySales: {},
        items: []
    };

    const items = merchandising.items || [];
    const currentStrategy = merchandising.inventoryStrategy || 'JustInTime';

    const getDemandFactor = (price: number, referencePrice: number) => {
        const safePrice = Math.max(0.01, Number.isFinite(price) ? price : 0.01);
        const safeReference = Math.max(0.01, Number.isFinite(referencePrice) ? referencePrice : 0.01);
        const ratio = safeReference / safePrice;
        const bounded = Math.max(0, Math.min(2.25, ratio));
        return Math.pow(bounded, 1.35);
    };

    const getMaxPrice = (costPerUnit: number) => {
        const referencePrice = Math.max(1, costPerUnit * 2.5);
        return Math.min(2000, referencePrice * 10);
    };

    const handlePriceChange = (itemId: string, newPrice: number) => {
        dispatch({ 
            type: 'UPDATE_MERCH_ITEM_PRICE', 
            payload: { itemId, price: newPrice } 
        });
    };

    const handleStrategyChange = (strategy: 'Conservative' | 'Aggressive' | 'JustInTime' | 'Bulk') => {
        dispatch({ type: 'SET_MERCH_STRATEGY', payload: { strategy } });
    };

    const handleNilSplitChange = (split: number) => {
        dispatch({ type: 'SET_NIL_SPLIT', payload: split });
    };

    // Projections
    const avgAttendance = state.currentUserTeamAttendance.length > 0
        ? state.currentUserTeamAttendance.reduce((sum, r) => sum + r.attendance, 0) / state.currentUserTeamAttendance.length
        : 5000;

    const projectedRevenue = items.reduce((sum, item) => {
        const starPower = userTeam.roster.reduce((s, p) => s + (p.socialMediaHeat || 0), 0) / 500;
        const referencePrice = item.costPerUnit * 2.5;
        const demandFactor = getDemandFactor(item.price, referencePrice);
        const buyRate = 0.15 * item.demandMultiplier * demandFactor * (1 + starPower);
        const unitsSold = Math.round(avgAttendance * buyRate);
        return sum + (unitsSold * item.price);
    }, 0);

    const projectedProfit = items.reduce((sum, item) => {
        const starPower = userTeam.roster.reduce((s, p) => s + (p.socialMediaHeat || 0), 0) / 500;
        const referencePrice = item.costPerUnit * 2.5;
        const demandFactor = getDemandFactor(item.price, referencePrice);
        const buyRate = 0.15 * item.demandMultiplier * demandFactor * (1 + starPower);
        const unitsSold = Math.round(avgAttendance * buyRate);
        return sum + (unitsSold * (item.price - item.costPerUnit));
    }, 0);

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            height: '100%',
            fontFamily: "'Press Start 2P', cursive",
            padding: '1rem',
        } as React.CSSProperties,
        headerCard: {
            backgroundColor: '#fff',
            border: `4px solid ${colors.primary}`,
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '4px 4px 0 rgba(0,0,0,0.1)',
        } as React.CSSProperties,
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
        } as React.CSSProperties,
        itemCard: {
            backgroundColor: '#fff',
            border: '2px solid #ccc',
            padding: '1rem',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            position: 'relative',
        } as React.CSSProperties,
        itemHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #eee',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem',
        } as React.CSSProperties,
        itemName: {
            fontWeight: 'bold',
            color: colors.primary,
            fontSize: '0.9rem',
        } as React.CSSProperties,
        badge: {
            fontSize: '0.6rem',
            padding: '0.2rem 0.4rem',
            backgroundColor: '#eee',
            borderRadius: '4px',
            color: '#666',
        } as React.CSSProperties,
        priceControl: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
        } as React.CSSProperties,
        input: {
            width: '80px',
            padding: '0.4rem',
            fontFamily: 'inherit',
            fontSize: '0.8rem',
            border: '2px solid #ccc',
            borderRadius: '4px',
        } as React.CSSProperties,
        profitText: {
            fontSize: '0.7rem',
            color: '#2e7d32',
            marginTop: '0.25rem',
        } as React.CSSProperties,
        statRow: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: '#666',
        } as React.CSSProperties,
        strategyButton: (isActive: boolean) => ({
            padding: '0.5rem 0.75rem',
            border: isActive ? `2px solid ${colors.primary}` : '2px solid #ccc',
            backgroundColor: isActive ? colors.primary : '#fff',
            color: isActive ? '#fff' : '#666',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.6rem',
            boxShadow: isActive ? 'none' : '2px 2px 0 #ccc',
            transform: isActive ? 'translate(1px, 1px)' : 'none',
        } as React.CSSProperties),
    };
    const getSentiment = (price: number, cost: number) => {
        const baseRef = cost * 2.5;
        const morale = userTeam.fanMorale ?? 50;
        const moraleFactor = 0.75 + ((morale / 100) * 0.5);
        const fairPrice = baseRef * moraleFactor;
        
        const ratio = price / fairPrice;
        if (ratio < 0.85) return { label: 'Great Value', color: '#2e7d32' };
        if (ratio < 1.15) return { label: 'Fair', color: '#1976d2' };
        if (ratio < 1.45) return { label: 'Pricey', color: '#f57c00' };
        return { label: 'Rip-off', color: '#d32f2f' };
    };

    return (
        <div style={styles.container}>
            <div style={styles.headerCard}>
                <div>
                    <h2 style={{margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: colors.primary}}>Team Store</h2>
                    <div style={{fontSize: '0.8rem', color: '#666'}}>
                        Proj. Revenue: <strong style={{color: '#2e7d32'}}>${projectedRevenue.toLocaleString()}</strong> | 
                        Proj. Profit: <strong style={{color: '#2e7d32'}}>${projectedProfit.toLocaleString()}</strong>
                    </div>
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end'}}>
                    <div style={{fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase'}}>Inventory Strategy</div>
                    <div style={{display: 'flex', gap: '0.25rem'}}>
                        {(['Conservative', 'JustInTime', 'Bulk', 'Aggressive'] as const).map(s => (
                            <button 
                                key={s} 
                                onClick={() => handleStrategyChange(s)}
                                style={styles.strategyButton(currentStrategy === s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end', marginTop: '0.5rem'}}>
                        <div style={{fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase'}}>NIL Revenue Share</div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end'}}>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="5" 
                                value={merchandising.nilSplit || 0} 
                                onChange={(e) => handleNilSplitChange(parseInt(e.target.value))}
                                style={{width: '100px'}}
                            />
                            <span style={{fontSize: '0.8rem', fontWeight: 'bold', color: colors.primary}}>{merchandising.nilSplit || 0}%</span>
                        </div>
                        <div style={{fontSize: '0.5rem', color: '#666'}}>Shared with players</div>
                    </div>
                </div>
            </div>

            <div style={styles.grid}>
                {items.map(item => {
                    const referencePrice = item.costPerUnit * 2.5;
                    const margin = item.price - item.costPerUnit;
                    const marginPercent = (margin / item.price) * 100;
                    const sentiment = getSentiment(item.price, item.costPerUnit);
                    
                    return (
                        <div key={item.id} style={styles.itemCard}>
                            <div style={styles.itemHeader}>
                                <span style={styles.itemName}>{item.name}</span>
                                <span style={styles.badge}>{item.type}</span>
                            </div>
                            
                            <div style={styles.statRow}>
                                <span>Cost: ${item.costPerUnit.toFixed(2)}</span>
                                <span>Ref: ${referencePrice.toFixed(2)}</span>
                            </div>

                            <div style={styles.priceControl}>
                                <label style={{fontSize: '0.7rem'}}>Price:</label>
                                <input 
                                    type="number" 
                                    step="1.00" 
                                    value={item.price} 
                                    min="0"
                                    max={getMaxPrice(item.costPerUnit)}
                                    onChange={(e) => handlePriceChange(item.id, Math.max(0, parseFloat(e.target.value) || 0))}
                                    style={styles.input}
                                />
                                <span style={{
                                    fontSize: '0.6rem', 
                                    color: '#fff', 
                                    backgroundColor: sentiment.color,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    marginLeft: 'auto',
                                    fontWeight: 'bold',
                                    boxShadow: '1px 1px 0 rgba(0,0,0,0.2)'
                                }}>
                                    {sentiment.label}
                                </span>
                            </div>

                            <div style={styles.profitText}>
                                Profit: ${margin.toFixed(2)} ({marginPercent.toFixed(0)}%)
                            </div>
                            
                            <div style={{fontSize: '0.6rem', color: '#888', marginTop: '0.5rem'}}>
                                Strategy: {item.inventoryStrategy}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {items.length === 0 && (
                <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
                    No merchandise items defined. Run a simulation week to initialize defaults.
                </div>
            )}
        </div>
    );
};

export default MerchandisingTab;
