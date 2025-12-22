
import React from 'react';
import type { GameAction } from './types';

interface TeamSelectionProps {
    dispatch: React.Dispatch<GameAction>;
}

const TeamSelection: React.FC<TeamSelectionProps> = ({ dispatch }) => {
    return (
        <div>
            <h1>Team Selection</h1>
            <p>This is a placeholder for the TeamSelection component.</p>
            <button onClick={() => dispatch({ type: 'SELECT_TEAM', payload: 'Some Team' })}>Select Default Team</button>
        </div>
    );
};

export default TeamSelection;
