import React, { useEffect } from 'react';

function Modal({ content, onClose, onOpenModal, showToast, onOpenTemplates, onInstallTemplate }) {
  useEffect(() => {
    if (!content) return;
    
    const handleTemplateClick = (e) => {
      if (e.target.closest('[data-action="use-template"]')) {
        if (onOpenTemplates) {
          onOpenTemplates();
        }
      }

      const installEl = e.target.closest('[data-template]');
      if (installEl && onInstallTemplate) {
        const templateName = installEl.getAttribute('data-template');
        if (templateName) {
          onInstallTemplate(templateName);
        }
      }
    };

    setTimeout(() => {
      const modal = document.querySelector('.modal');
      if (modal) {
        modal.addEventListener('click', handleTemplateClick);
      }
    }, 0);

    return () => {
      const modal = document.querySelector('.modal');
      if (modal) {
        modal.removeEventListener('click', handleTemplateClick);
      }
    };
  }, [content, onOpenTemplates, onInstallTemplate]);

  if (!content) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div 
        className={`modal ${content.small ? 'small' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2>{content.title}</h2>
            {content.subtitle && <div className="sub">{content.subtitle}</div>}
          </div>
          <button className="close" onClick={onClose}>Close</button>
        </div>
        <div dangerouslySetInnerHTML={{ __html: content.body }} />
      </div>
    </div>
  );
}

export default Modal;
