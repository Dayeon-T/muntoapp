import { useState } from 'react';
import SocialingTab from './components/SocialingTab';
import AddSocialing from './components/AddSocialing';

function App() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvents, setNewEvents] = useState([]);

  const handleAddEvent = (eventData) => {
    console.log('새 소셜링 추가:', eventData);
    setNewEvents((prev) => [...prev, eventData]);
    // TODO: 실제로는 API 호출하거나 전역 상태에 저장
    alert(`소셜링 "${eventData.title}" 이(가) 추가되었습니다!`);
  };

  if (showAddForm) {
    return (
      <AddSocialing
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddEvent}
      />
    );
  }

  return (
    <div>
      <SocialingTab 
        newEvents={newEvents} 
        onAddClick={() => setShowAddForm(true)} 
      />
    </div>
  );
}

export default App
