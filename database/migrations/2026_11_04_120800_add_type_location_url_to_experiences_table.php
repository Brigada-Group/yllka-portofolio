<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('experiences', function (Blueprint $table) {
            $table->string('type')->default('work')->after('id');
            $table->string('location')->nullable()->after('position');
            $table->string('url')->nullable()->after('location');
            // Show "Apr 2023" rather than just "2023", when the months are known.
            $table->boolean('show_months')->default(false)->after('end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('experiences', function (Blueprint $table) {
            $table->dropColumn(['type', 'location', 'url', 'show_months']);
        });
    }
};
