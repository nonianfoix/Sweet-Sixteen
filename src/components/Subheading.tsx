import React from 'react';

export type SubheadingProps = {
    children?: React.ReactNode;
    color: string;
};

const Subheading = ({ children, color }: SubheadingProps) => (
    <h4 style={{ color, borderBottom: `2px solid ${color}`, paddingBottom: '5px', marginBottom: '10px', marginTop: '20px' }}>{children}</h4>
);

export default Subheading;
