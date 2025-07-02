import React from 'react';
import FaceDetector from './FaceDetector';

const InputMonitor = (props) => {
  const { setFusionInputs } = props;

  const handleFaceInput = ({ emotion, stress }) => {
    setFusionInputs(prev => ({ ...prev, face: stress }));
  };

  return (
    <div className="ml-64 p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-4">🎛 Input Monitor</h2>
      <FaceDetector onEmotionDetected={handleFaceInput} />
      {/* Optionally add live typing or voice meters */}
    </div>
  );
};

export default InputMonitor;
