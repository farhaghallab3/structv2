import React from 'react';

function Drawer({ content, onClose }) {
  if (!content) return null;

  return (
    <div className="drawer">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

export default Drawer;
