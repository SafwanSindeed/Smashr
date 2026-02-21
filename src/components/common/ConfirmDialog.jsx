import React from 'react';

// A simple pop-up box to ask "Are you sure?"
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  // If the dialog is not open, show nothing
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-end gap-4">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded"
          >
            No, Keep it
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Yes, Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
