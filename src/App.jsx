import { useState } from "react";
import SocialingTab from "./components/SocialingTab";
import AddSocialing from "./components/AddSocialing";
import { ToastProvider, useToast } from "./components/Toast";
import { addSocialing, updateSocialing } from "./services/socialingService";

function AppContent() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // 수정 중인 소셜링
  const [refreshKey, setRefreshKey] = useState(0); // 목록 새로고침용
  const toast = useToast();

  const handleAddEvent = async (eventData, isEdit = false) => {
    try {
      if (isEdit) {
        console.log("소셜링 수정:", eventData);
        await updateSocialing(eventData.id, eventData);
        toast.success(`소셜링 "${eventData.title}"이(가) 수정되었습니다!`);
      } else {
        console.log("새 소셜링 추가:", eventData);
        await addSocialing(eventData);
        toast.success(`소셜링 "${eventData.title}"이(가) 추가되었습니다!`);
      }
      setEditingEvent(null);
      setRefreshKey((prev) => prev + 1); // 목록 새로고침
    } catch (error) {
      console.error("소셜링 저장 실패:", error);
      toast.error(
        isEdit ? "소셜링 수정에 실패했습니다" : "소셜링 추가에 실패했습니다"
      );
    }
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
        key={refreshKey}
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

export default App;
