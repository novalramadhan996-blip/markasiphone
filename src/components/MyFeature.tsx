'use client';

import { FC } from 'react';

interface MyFeatureProps {
  title: string;
}

export const MyFeature: FC<MyFeatureProps> = ({ title }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
};