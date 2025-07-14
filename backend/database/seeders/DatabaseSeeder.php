<?php

namespace Database\Seeders;

use Carbon\Carbon;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // User::factory()->create([
        //     'name' => 'John Doe',
        //     'email' => 'john@example.com',
        //     'password' => bcrypt('password'),
        // ]);

        // User::factory()->create([
        //     'name' => 'Test Name',
        //     'email' => 'test@example.com',
        //     'password' => bcrypt('password'),
        // ]);

        // User::factory(10)->create();

        Message::factory(1000)->create();
        $messages = Message::orderBy('created_at')->get();

        //group all messages by sender-receiver ID to get array like this
        //[1_2 => [[1,2], [2, 1]]
        $conversations = $messages->groupBy(function ($message) {
            return collect([$message->sender_id, $message->receiver_id])
                ->sort()->implode('_');
        })->map(function ($groupedMessages) {
            return [
                'user_id_1' => $groupedMessages->first()->sender_id,
                'user_id_2' => $groupedMessages->first()->receiver_id,
                'last_message_id' => $groupedMessages->last()->id,
                'created_at' => new Carbon(),
                'updated_at' => new Carbon(),
            ];
        });

        Conversation::insertOrIgnore($conversations->toArray());

    }
}
