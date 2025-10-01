import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { UnifiedTaskDialog, DialogMode } from '@/features/tasks/ui/unified-task-dialog';
import { Plus, ListTodo } from 'lucide-react';

export const UnifiedTaskDialogTest = () => {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = useState(false);
  const [lastCreatedTask, setLastCreatedTask] = useState<string | null>(null);

  const handleTaskSuccess = () => {
    setLastCreatedTask('Задача успешно создана!');
    setTimeout(() => setLastCreatedTask(null), 3000);
  };

  const handleSubtaskSuccess = () => {
    setLastCreatedTask('Подзадача успешно создана!');
    setTimeout(() => setLastCreatedTask(null), 3000);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Тестирование UnifiedTaskDialog</h1>
        <p className="text-muted-foreground">
          Демонстрация работы унифицированного диалога создания задач и подзадач
        </p>
      </div>

      {/* Уведомление об успехе */}
      {lastCreatedTask && (
        <div className="mx-auto max-w-md">
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-800">{lastCreatedTask}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Тест создания задачи */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Создание задачи
            </CardTitle>
            <CardDescription>
              Тестирование режима создания основной задачи с полным набором полей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setIsTaskDialogOpen(true)}
              className="w-full"
            >
              Открыть диалог создания задачи
            </Button>
          </CardContent>
        </Card>

        {/* Тест создания подзадачи */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Создание подзадачи
            </CardTitle>
            <CardDescription>
              Тестирование режима создания подзадачи с упрощенным набором полей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setIsSubtaskDialogOpen(true)}
              variant="outline"
              className="w-full"
            >
              Открыть диалог создания подзадачи
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Информация о функциональности */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Особенности UnifiedTaskDialog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Режим "Задача":</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Поле выбора типа задачи (Личная/Командная)</li>
                <li>• Все базовые поля (название, описание, приоритет)</li>
                <li>• Поля для срока выполнения и оценки времени</li>
                <li>• Валидация через Zod схему</li>
                <li>• Интеграция с useCreateTaskMutation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Режим "Подзадача":</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Упрощенный набор полей (без типа задачи)</li>
                <li>• Автоматическая привязка к родительской задаче</li>
                <li>• Базовые поля (название, описание, приоритет)</li>
                <li>• Поля для срока выполнения и оценки времени</li>
                <li>• Интеграция с useCreateSubtaskMutation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Диалоги */}
      <UnifiedTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        mode="task"
        onSuccess={handleTaskSuccess}
      />

      <UnifiedTaskDialog
        open={isSubtaskDialogOpen}
        onOpenChange={setIsSubtaskDialogOpen}
        mode="subtask"
        parentTaskId={1} // Тестовый ID родительской задачи
        onSuccess={handleSubtaskSuccess}
      />
    </div>
  );
};