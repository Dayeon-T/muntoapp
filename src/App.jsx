import { useState } from 'react';
import SocialingTab from './components/SocialingTab';
import AddSocialing from './components/AddSocialing';
import { ToastProvider, useToast } from './components/Toast';

function AppContent() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // 수정 중인 소셜링
  const [newEvents, setNewEvents] = useState([]);
  const toast = useToast();

  const handleAddEvent = (eventData, isEdit = false) => {
    if (isEdit) {
      console.log('소셜링 수정:', eventData);
      setNewEvents((prev) => 
        prev.map((e) => (e.id === eventData.id ? eventData : e))
      );
      toast.success(`소셜링 "${eventData.title}"이(가) 수정되었습니다!`);
    } else {
      console.log('새 소셜링 추가:', eventData);
      setNewEvents((prev) => [...prev, eventData]);
      toast.success(`소셜링 "${eventData.title}"이(가) 추가되었습니다!`);
    }
    setEditingEvent(null);
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingEvent(null);
  };

  if (showAddForm) {
    return (
      <AddSocialing
        onClose={handleCloseForm}
        onSubmit={handleAddEvent}
        editEvent={editingEvent}
      />
    );
  }

  return (
    <div>
      <SocialingTab 
        newEvents={newEvents} 
        onAddClick={() => setShowAddForm(true)}
        onEditClick={handleEditClick}
      />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App
