<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;


class AddAvatarsToUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
 public function run()
    {
        $users = User::all();

        foreach ($users as $user) {
            // Option 1: Pravatar (random realistic faces)
            $avatarUrl = 'https://i.pravatar.cc/150?u=' . $user->id;

            // Option 2: Dicebear (cartoon-style avatars)
            // $avatarUrl = 'https://api.dicebear.com/7.x/adventurer/svg?seed=' . $user->email;

            $user->update([
                'avatar' => $avatarUrl
            ]);
        }
    }
}
