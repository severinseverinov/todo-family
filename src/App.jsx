import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// --- SUPABASE KURULUMU ---
const supabaseUrl = "https://ollzqfylpetmgvjzbagk.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- YARDIMCI BİLEŞENLER ---

// Renk Seçim Modalı
function ColorPickerModal({ onColorSelect }) {
  const colors = [
    "#fecaca",
    "#fed7aa",
    "#fef08a",
    "#d9f99d",
    "#bfdbfe",
    "#e9d5ff",
  ];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-4">Bir Renk Seçin</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Bu renk, oluşturduğunuz görevlerde sizin imzanız olacak.
        </p>
        <div className="flex justify-center flex-wrap gap-4 mb-6">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => onColorSelect(color)}
              style={{ backgroundColor: color }}
              className="w-12 h-12 rounded-full border-2 border-transparent hover:border-blue-500 focus:border-blue-500 outline-none transition"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- ANA BİLEŞENLER ---

// Her bir yapılacaklar listesini temsil eden bileşen
function TodoListComponent({ list, session, onDeleteList, onUpdateList }) {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);

  const [isEditingList, setIsEditingList] = useState(false);
  const [editedListName, setEditedListName] = useState(list.name);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedTaskText, setEditedTaskText] = useState("");

  // Görevleri getiren fonksiyon
  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("list_id", list.id)
      .order("created_at", { ascending: true });
    if (data) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [list.id]);

  // Liste adını kaydetme
  const handleSaveListName = () => {
    if (editedListName.trim() && editedListName.trim() !== list.name) {
      onUpdateList(list.id, editedListName.trim());
    }
    setIsEditingList(false);
  };

  // Görev ekleme (Kullanıcı rengi ve e-postası ile birlikte)
  const handleAddTask = async () => {
    if (inputValue.trim() === "") return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: newTask, error } = await supabase
      .from("tasks")
      .insert({
        text: inputValue.trim(),
        user_id: user.id,
        list_id: list.id,
        user_email: user.email,
        user_color: user.user_metadata.color || "#e5e7eb", // Varsayılan renk
      })
      .select()
      .single();
    if (!error) {
      setTasks([...tasks, newTask]);
      setInputValue("");
    }
  };

  const handleDeleteTask = async taskId => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (!error) setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleToggleComplete = async (taskId, currentState) => {
    const { data } = await supabase
      .from("tasks")
      .update({ completed: !currentState })
      .eq("id", taskId)
      .select()
      .single();
    if (data) setTasks(tasks.map(t => (t.id === taskId ? data : t)));
  };

  const handleUpdateTaskText = async taskId => {
    if (editedTaskText.trim() === "") return setEditingTaskId(null);
    const { data } = await supabase
      .from("tasks")
      .update({ text: editedTaskText.trim() })
      .eq("id", taskId)
      .select()
      .single();
    if (data) setTasks(tasks.map(t => (t.id === taskId ? data : t)));
    setEditingTaskId(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800/80 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        {isEditingList ? (
          <input
            type="text"
            value={editedListName}
            onChange={e => setEditedListName(e.target.value)}
            onBlur={handleSaveListName}
            onKeyPress={e => e.key === "Enter" && handleSaveListName()}
            className="text-xl font-bold bg-gray-100 dark:bg-gray-700 rounded p-1 -m-1 w-full mr-2"
          />
        ) : (
          <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">
            {list.name}
          </h2>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsEditingList(true)}
            className="text-gray-400 hover:text-blue-500 transition-colors"
            title="Listeyi Düzenle"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDeleteList(list.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Listeyi Sil"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-grow">
        <ul className="space-y-2">
          {tasks.map(task => (
            <li
              key={task.id}
              style={{
                borderLeft: `4px solid ${task.user_color || "#e5e7eb"}`,
              }}
              className="bg-gray-50 dark:bg-gray-700/60 p-3 rounded-lg group"
            >
              {editingTaskId === task.id ? (
                <input
                  type="text"
                  value={editedTaskText}
                  onChange={e => setEditedTaskText(e.target.value)}
                  onBlur={() => handleUpdateTaskText(task.id)}
                  onKeyPress={e =>
                    e.key === "Enter" && handleUpdateTaskText(task.id)
                  }
                  className="w-full bg-transparent focus:bg-gray-100 dark:focus:bg-gray-600 rounded p-1 -m-1"
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p
                      onClick={() =>
                        handleToggleComplete(task.id, task.completed)
                      }
                      className={`cursor-pointer ${
                        task.completed ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {task.text}
                    </p>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <span>{task.user_email}</span> -{" "}
                      <span>
                        {new Date(task.created_at).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                    <button
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setEditedTaskText(task.text);
                      }}
                      className="text-gray-400 hover:text-blue-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={e => e.key === "Enter" && handleAddTask()}
          placeholder="Yeni görev..."
          className="flex-grow w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 rounded-md text-sm outline-none transition"
        />
        <button
          onClick={handleAddTask}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}

// Ana içerik bileşeni
function AppContent({ session }) {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState("");
  useEffect(() => {
    fetchLists();
  }, []);
  const fetchLists = async () => {
    const { data } = await supabase
      .from("todo_lists")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setLists(data);
  };
  const handleCreateList = async e => {
    e.preventDefault();
    if (newListName.trim() === "") return;
    const { data } = await supabase
      .from("todo_lists")
      .insert({ name: newListName.trim(), user_id: session.user.id })
      .select()
      .single();
    if (data) {
      setLists([...lists, data]);
      setNewListName("");
    }
  };
  const handleDeleteList = async listId => {
    const { error } = await supabase
      .from("todo_lists")
      .delete()
      .eq("id", listId);
    if (!error) setLists(lists.filter(l => l.id !== listId));
  };
  const handleUpdateList = async (listId, newName) => {
    const { data } = await supabase
      .from("todo_lists")
      .update({ name: newName })
      .eq("id", listId)
      .select()
      .single();
    if (data) setLists(lists.map(l => (l.id === listId ? data : l)));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Listelerim
        </h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Çıkış Yap
        </button>
      </div>
      <form
        onSubmit={handleCreateList}
        className="flex items-center gap-3 mb-10 p-4 bg-white dark:bg-gray-900/50 rounded-lg shadow-lg"
      >
        <input
          type="text"
          value={newListName}
          onChange={e => setNewListName(e.target.value)}
          placeholder="Yeni bir liste oluştur..."
          className="flex-grow w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 rounded-lg outline-none transition"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-lg shadow-md transition"
        >
          Oluştur
        </button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map(list => (
          <TodoListComponent
            key={list.id}
            list={list}
            session={session}
            onDeleteList={handleDeleteList}
            onUpdateList={handleUpdateList}
          />
        ))}
      </div>
    </div>
  );
}

// Giriş Formu Bileşeni
function AuthComponent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.message);
    else setMessage("Giriş linki için e-postanızı kontrol edin!");
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto text-center bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 sm:p-8">
      <h1 className="text-3xl font-bold mb-6">Giriş Yap</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Devam etmek için e-postanıza gönderilecek sihirli linki kullanın.
      </p>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="e-posta@adresiniz.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 mb-4 text-center bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-lg shadow-md transition disabled:opacity-50"
        >
          {loading ? "Gönderiliyor..." : "Sihirli Link Gönder"}
        </button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}

// Ana Uygulama Bileşeni
export default function App() {
  const [session, setSession] = useState(null);
  const [needsColorSelection, setNeedsColorSelection] = useState(false);

  useEffect(() => {
    // İlk oturum bilgisini al
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user && !session.user.user_metadata?.color) {
        setNeedsColorSelection(true);
      }
    });

    // Oturum değişikliklerini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user && !session.user.user_metadata?.color) {
          setNeedsColorSelection(true);
        } else {
          setNeedsColorSelection(false);
        }
      }
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Kullanıcının rengini kaydeden fonksiyon
  const handleColorSelect = async color => {
    const { data, error } = await supabase.auth.updateUser({
      data: { color: color },
    });
    if (!error) {
      setNeedsColorSelection(false);
      // Arayüzün anında güncellenmesi için session state'ini yeni kullanıcı bilgisiyle güncelle
      setSession(prevSession => ({ ...prevSession, user: data.user }));
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen font-sans py-12 px-4">
      <div className="w-full max-w-7xl mx-auto">
        {needsColorSelection && (
          <ColorPickerModal onColorSelect={handleColorSelect} />
        )}

        {session ? (
          <AppContent session={session} />
        ) : (
          <div className="flex items-center justify-center pt-16">
            <AuthComponent />
          </div>
        )}
      </div>
    </div>
  );
}
